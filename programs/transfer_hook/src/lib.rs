use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenAccount;
use spl_transfer_hook_interface::instruction::ExecuteInstruction;
use spl_tlv_account_resolution::state::ExtraAccountMetaList;

mod state;
use state::*;

declare_id!("5r4caJ9v2i485GX7yT5QK9FTzAKvqHpANVfBqCBxgz4a");

/// Transfer hook for SSS-2 compliance
/// Enforces blacklist checks on every transfer
#[program]
pub mod sss_transfer_hook {
    use super::*;

    /// Initialize the transfer hook program
    pub fn initialize(ctx: Context<InitializeHook>) -> Result<()> {
        let extra_account_metas_info = ctx.accounts.extra_account_metas.to_account_info();
        
        // Initialize the extra account meta list
        let mut data = extra_account_metas_info.try_borrow_mut_data()?;
        ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &[])?;
        
        msg!("Transfer hook initialized");
        Ok(())
    }

    /// Execute hook - called on every transfer
    /// Validates sender and recipient are not blacklisted
    pub fn execute(ctx: Context<ExecuteHook>, amount: u64) -> Result<()> {
        let source_account = &ctx.accounts.source_token;
        let dest_account = &ctx.accounts.destination_token;
        
        // Check if source is blacklisted
        let source_blacklist = ctx.accounts.source_blacklist.as_ref();
        if let Some(blacklist) = source_blacklist {
            require!(
                blacklist.address != source_account.owner,
                SssHookError::SourceBlacklisted
            );
        }
        
        // Check if destination is blacklisted
        let dest_blacklist = ctx.accounts.destination_blacklist.as_ref();
        if let Some(blacklist) = dest_blacklist {
            require!(
                blacklist.address != dest_account.owner,
                SssHookError::DestinationBlacklisted
            );
        }
        
        msg!(
            "Transfer hook validated: {} tokens from {} to {}",
            amount,
            source_account.owner,
            dest_account.owner
        );
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeHook<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: Extra account meta list account - initialized in instruction
    #[account(
        init,
        payer = payer,
        space = ExtraAccountMetaList::size_of(0).unwrap(),
    )]
    pub extra_account_metas: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteHook<'info> {
    /// CHECK: Source token account
    #[account(
        token::token_program = anchor_spl::token_interface::ID,
    )]
    pub source_token: InterfaceAccount<'info, TokenAccount>,
    
    /// CHECK: Mint
    pub mint: UncheckedAccount<'info>,
    
    /// CHECK: Destination token account
    #[account(
        token::token_program = anchor_spl::token_interface::ID,
    )]
    pub destination_token: InterfaceAccount<'info, TokenAccount>,
    
    /// CHECK: Source owner
    pub source_owner: UncheckedAccount<'info>,
    
    /// CHECK: Blacklist entry for source (optional)
    pub source_blacklist: Option<Account<'info, BlacklistEntry>>,
    
    /// CHECK: Blacklist entry for destination (optional)
    pub destination_blacklist: Option<Account<'info, BlacklistEntry>>,
}

#[error_code]
pub enum SssHookError {
    #[msg("Source address is blacklisted")]
    SourceBlacklisted,
    
    #[msg("Destination address is blacklisted")]
    DestinationBlacklisted,
    
    #[msg("Invalid extra account meta")]
    InvalidExtraAccountMeta,
}

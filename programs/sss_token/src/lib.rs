use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{Token2022, MintTo, Burn, FreezeAccount, ThawAccount},
    metadata::Metadata,
};

pub mod error;
pub mod instructions;
pub mod state;

use error::*;
use instructions::*;
use state::*;

declare_id!("DTQEHEAvQ1ZuPs3QEHbN8WJFp4C66PjUfCZWj6RLnaBn");

#[program]
pub mod sss_token {
    use super::*;

    /// Initialize a new stablecoin with configurable preset
    pub fn initialize(
        ctx: Context<Initialize>,
        config: StablecoinConfig,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, config)
    }

    /// Mint new tokens (requires minter role)
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::mint::handler(ctx, amount)
    }

    /// Burn tokens (requires burner role or owner)
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::burn::handler(ctx, amount)
    }

    /// Freeze an account (requires freezer role)
    pub fn freeze_account(
        ctx: Context<FreezeTokenAccount>,
    ) -> Result<()> {
        instructions::freeze::handler(ctx)
    }

    /// Thaw (unfreeze) an account (requires freezer role)
    pub fn thaw_account(
        ctx: Context<ThawTokenAccount>,
    ) -> Result<()> {
        instructions::thaw::handler(ctx)
    }

    /// Pause all transfers (requires pauser role)
    pub fn pause(ctx: Context<PauseStablecoin>) -> Result<()> {
        instructions::pause::handler_pause(ctx)
    }

    /// Unpause transfers (requires pauser role)
    pub fn unpause(ctx: Context<PauseStablecoin>) -> Result<()> {
        instructions::pause::handler_unpause(ctx)
    }

    /// Add address to blacklist (SSS-2, requires blacklister role)
    pub fn add_to_blacklist(
        ctx: Context<BlacklistManagement>,
        address: Pubkey,
        reason: String,
    ) -> Result<()> {
        instructions::blacklist::handler_add(ctx, address, reason)
    }

    /// Remove address from blacklist (SSS-2, requires blacklister role)
    pub fn remove_from_blacklist(
        ctx: Context<BlacklistRemove>,
        address: Pubkey,
    ) -> Result<()> {
        instructions::blacklist::handler_remove(ctx, address)
    }

    /// Seize tokens from frozen/blacklisted account (SSS-2, requires seizer role)
    pub fn seize_tokens(
        ctx: Context<SeizeTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::seize::handler(ctx, amount)
    }

    /// Update minter quota
    pub fn update_minter(
        ctx: Context<UpdateMinterRole>,
        minter: Pubkey,
        quota: u64,
        active: bool,
    ) -> Result<()> {
        instructions::roles::handler_update_minter(ctx, minter, quota, active)
    }

    /// Update burner status
    pub fn update_burner(
        ctx: Context<UpdateBurnerRole>,
        burner: Pubkey,
        active: bool,
    ) -> Result<()> {
        instructions::roles::handler_update_burner(ctx, burner, active)
    }

    /// Transfer master authority
    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        instructions::authority::handler_transfer(ctx, new_authority)
    }

    /// Update metadata URI
    pub fn update_metadata(
        ctx: Context<UpdateMetadata>,
        uri: String,
    ) -> Result<()> {
        instructions::metadata_ix::handler_update(ctx, uri)
    }

    /// Close the stablecoin (requires master authority, all tokens must be burned)
    pub fn close_stablecoin(ctx: Context<CloseStablecoin>) -> Result<()> {
        instructions::close::handler(ctx)
    }
}

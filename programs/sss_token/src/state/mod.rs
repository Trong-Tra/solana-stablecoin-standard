use anchor_lang::prelude::*;

pub mod config;
pub mod roles;
pub mod blacklist;

pub use config::*;
pub use roles::*;
pub use blacklist::*;

/// Stablecoin configuration - stored in PDA
#[account]
pub struct StablecoinState {
    /// Authority that controls the stablecoin
    pub master_authority: Pubkey,
    
    /// Mint address of the stablecoin
    pub mint: Pubkey,
    
    /// Stablecoin metadata
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
    
    /// Feature flags
    pub features: FeatureFlags,
    
    /// Current state
    pub paused: bool,
    pub total_minted: u64,
    pub total_burned: u64,
    
    /// Bump seed for PDA
    pub bump: u8,
    
    /// Version for migrations
    pub version: u8,
}

impl StablecoinState {
    pub const LEN: usize = 8 + // discriminator
        32 + // master_authority
        32 + // mint
        4 + 32 + // name (max 32 chars)
        4 + 10 + // symbol (max 10 chars)
        4 + 200 + // uri (max 200 chars)
        1 + // decimals
        4 + // feature flags
        1 + // paused
        8 + // total_minted
        8 + // total_burned
        1 + // bump
        1; // version
}

/// Feature flags for optional capabilities
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
pub struct FeatureFlags {
    /// Enable permanent delegate (for seizure)
    pub permanent_delegate: bool,
    /// Enable transfer hook (for blacklist enforcement)
    pub transfer_hook: bool,
    /// Default accounts to frozen
    pub default_account_frozen: bool,
    /// Enable confidential transfers
    pub confidential_transfers: bool,
}

impl FeatureFlags {
    pub const SSS1: Self = Self {
        permanent_delegate: false,
        transfer_hook: false,
        default_account_frozen: false,
        confidential_transfers: false,
    };
    
    pub const SSS2: Self = Self {
        permanent_delegate: true,
        transfer_hook: true,
        default_account_frozen: false,
        confidential_transfers: false,
    };
}

/// Configuration for initializing a stablecoin
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct StablecoinConfig {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
    /// Enable SSS-2 compliance features
    pub enable_permanent_delegate: bool,
    pub enable_transfer_hook: bool,
    pub default_account_frozen: bool,
}

impl StablecoinConfig {
    pub fn validate(&self) -> Result<()> {
        require!(self.decimals <= 9, crate::error::SssTokenError::InvalidDecimals);
        require!(self.name.len() <= 32, crate::error::SssTokenError::NameTooLong);
        require!(self.symbol.len() <= 10, crate::error::SssTokenError::SymbolTooLong);
        require!(self.uri.len() <= 200, crate::error::SssTokenError::UriTooLong);
        Ok(())
    }
    
    pub fn to_feature_flags(&self) -> FeatureFlags {
        FeatureFlags {
            permanent_delegate: self.enable_permanent_delegate,
            transfer_hook: self.enable_transfer_hook,
            default_account_frozen: self.default_account_frozen,
            confidential_transfers: false,
        }
    }
}

/// Minter state - tracks quota and usage
#[account]
pub struct MinterState {
    pub minter: Pubkey,
    pub mint: Pubkey,
    pub quota: u64,
    pub minted: u64,
    pub active: bool,
    pub bump: u8,
}

impl MinterState {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1 + 1;
}

/// Burner state
#[account]
pub struct BurnerState {
    pub burner: Pubkey,
    pub mint: Pubkey,
    pub active: bool,
    pub bump: u8,
}

impl BurnerState {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 1;
}

/// Blacklist entry
#[account]
pub struct BlacklistEntry {
    pub address: Pubkey,
    pub mint: Pubkey,
    pub reason: String,
    pub added_at: i64,
    pub added_by: Pubkey,
}

impl BlacklistEntry {
    pub const LEN: usize = 8 + 32 + 32 + 4 + 100 + 8 + 32;
}

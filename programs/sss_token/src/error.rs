use anchor_lang::prelude::*;

#[error_code]
pub enum SssTokenError {
    #[msg("Unauthorized: caller does not have required role")]
    Unauthorized,
    
    #[msg("Invalid preset configuration")]
    InvalidPreset,
    
    #[msg("Stablecoin is paused")]
    Paused,
    
    #[msg("Account is frozen")]
    AccountFrozen,
    
    #[msg("Address is blacklisted")]
    Blacklisted,
    
    #[msg("Compliance module not enabled")]
    ComplianceNotEnabled,
    
    #[msg("Minter quota exceeded")]
    QuotaExceeded,
    
    #[msg("Invalid amount")]
    InvalidAmount,
    
    #[msg("Invalid decimals")]
    InvalidDecimals,
    
    #[msg("Name too long (max 32 chars)")]
    NameTooLong,
    
    #[msg("Symbol too long (max 10 chars)")]
    SymbolTooLong,
    
    #[msg("URI too long (max 200 chars)")]
    UriTooLong,
    
    #[msg("Reason too long (max 100 chars)")]
    ReasonTooLong,
    
    #[msg("Account already exists")]
    AlreadyExists,
    
    #[msg("Account not found")]
    NotFound,
    
    #[msg("Cannot close: outstanding supply exists")]
    OutstandingSupply,
    
    #[msg("Permanent delegate not set")]
    NoPermanentDelegate,
    
    #[msg("Transfer hook not enabled")]
    TransferHookNotEnabled,
    
    #[msg("Invalid authority")]
    InvalidAuthority,
    
    #[msg("Math overflow")]
    MathOverflow,
    
    #[msg("Token-2022 extension error")]
    ExtensionError,
    
    #[msg("Metadata error")]
    MetadataError,
}

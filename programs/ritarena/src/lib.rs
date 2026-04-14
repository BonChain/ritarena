pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("5fYaY6696pCJfPQvxC3GwHEDS91hXs1JZNpEK4ZmhCfH");

#[program]
pub mod ritarena {
    use super::*;

    pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
        instructions::initialize_protocol::handler(ctx)
    }

    pub fn register_profile(ctx: Context<RegisterProfile>, name: String) -> Result<()> {
        instructions::register_profile::handler(ctx, name)
    }
}

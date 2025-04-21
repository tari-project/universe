use std::fmt::{Display, Formatter};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ABTestSelector {
    GroupA,
    GroupB,
}

impl Display for ABTestSelector {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            ABTestSelector::GroupA => write!(f, "Group A"),
            ABTestSelector::GroupB => write!(f, "Group B"),
        }
    }
}

#[repr(u8)]
#[derive(Debug, Clone, Copy)]
pub enum Opcode {
    LoadConst = 0x01,
    LoadVar = 0x02,
    StoreVar = 0x03,
    Add = 0x04,
    Sub = 0x05,
    Mul = 0x06,
    Div = 0x07,
    GreaterThan = 0x08,
    LessThan = 0x09,
    LoadConstString = 0x0A,
    Print = 0x10,
    JumpIfFalse = 0x20,
    Jump = 0x21,
    Concat = 0x28,
    Equals = 0x0B,
    NotEquals = 0x0C,
    Call = 0x30,
    Return = 0x31,
    GreaterEqual = 0x0D,
    LessEqual = 0x0E,
    ExecuteRust = 0x32,
    ExecutePython = 0x33,
    Negate,
}

// Add this implementation to convert u8 to Opcode
impl Opcode {
    pub fn from_u8(value: u8) -> Option<Self> {
        match value {
            0x01 => Some(Opcode::LoadConst),
            0x02 => Some(Opcode::LoadVar),
            0x03 => Some(Opcode::StoreVar),
            0x04 => Some(Opcode::Add),
            0x05 => Some(Opcode::Sub),
            0x06 => Some(Opcode::Mul),
            0x07 => Some(Opcode::Div),
            0x08 => Some(Opcode::GreaterThan),
            0x09 => Some(Opcode::LessThan),
            0x0A => Some(Opcode::LoadConstString),
            0x10 => Some(Opcode::Print),
            0x20 => Some(Opcode::JumpIfFalse),
            0x21 => Some(Opcode::Jump),
            0x28 => Some(Opcode::Concat),
            0x0B => Some(Opcode::Equals),
            0x0C => Some(Opcode::NotEquals),
            0x30 => Some(Opcode::Call),
            0x31 => Some(Opcode::Return),
            0x0D => Some(Opcode::GreaterEqual),
            0x0E => Some(Opcode::LessEqual),
            0x32 => Some(Opcode::ExecuteRust),
            0x33 => Some(Opcode::ExecutePython),
            0x34 => Some(Opcode::Negate),
            _ => None,
        }
    }
}

// You can remove the standalone CONCAT constant if it's redundant
// pub const CONCAT: u8 = 0x28; // 0x28
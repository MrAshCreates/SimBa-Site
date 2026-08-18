use logos::Logos;

#[derive(Logos, Debug, PartialEq, Clone)]
pub enum Token {
    // Keywords
    #[token("let")]
    Let,
    #[token("print")]
    Print,
    #[token("if")]
    If,
    #[token("elif")]
    Elif,
    #[token("else")]
    Else,
    #[token("while")]
    While,
    #[token("for")]
    For,
    #[token("in")]
    In,
    #[token("function")]
    #[token("def")]
    Func,
    #[token("return")]
    Return,
    #[token("break")]
    Break,
    #[token("continue")]
    Continue,
    #[token("pass")]
    Pass,
    #[token("and")]
    And,
    #[token("or")]
    Or,
    #[token("not")]
    Not,
    #[token("True")]
    #[token("true")]
    True,
    #[token("False")]
    #[token("false")]
    False,
    #[token("mut")]
    Mut,

    // Symbols
    #[token("+")]
    Plus,
    #[token("-")]
    Minus,
    #[token("*")]
    Asterisk,
    #[token("/")]
    Slash,
    #[token("+=")]
    PlusEqual,
    #[token("-=")]
    MinusEqual,
    #[token("*=")]
    StarEqual,
    #[token("%")]
    Percent,
    #[token("(")]
    LeftParen,
    #[token(")")]
    RightParen,
    #[token("{")]
    LeftBrace,
    #[token("}")]
    RightBrace,
    #[token(";")]
    Semicolon,
    #[token(",")]
    Comma,
    #[token(":")]
    Colon,
    #[token("=")]
    Equal,
    #[token("==")]
    Equals,
    #[token("!=")]
    NotEqual,
    #[token(">")]
    GreaterThan,
    #[token("<")]
    LessThan,
    #[token(">=")]
    GreaterEqual,
    #[token("<=")]
    LessEqual,

    // Literals
    #[regex(r#""(?:\\.|[^"\\])*""#, |lex| {
        let slice = lex.slice();
        let unquoted = &slice[1..slice.len() - 1];
        unquoted.to_string()
    })]
    StringLiteral(String),
    #[regex(r"[0-9]+", |lex| lex.slice().parse::<i64>().ok())]
    Integer(i64),
    #[regex(r"[A-Za-z_][A-Za-z0-9_]*", |lex| lex.slice().to_string())]
    Identifier(String),

    // Embedded code blocks
    #[token("$rust", lex_rust_code)]
    RustCode(String),

    #[token("$python", lex_python_code)]
    PythonCode(String),

    // Whitespace and comments (skipped)
    #[regex(r"[ \t\r\n]+", logos::skip)]
    #[regex(r"//[^\n]*", logos::skip, allow_greedy = true)]
    #[regex(r"#[^\n]*", logos::skip, allow_greedy = true)]
    #[regex(r"/\*([^*]|\*[^/])*\*/", logos::skip)]
    Skip,
}

fn lex_rust_code(lex: &mut logos::Lexer<Token>) -> Option<String> {
    lex_embedded_code(lex, "rust$")
}

fn lex_python_code(lex: &mut logos::Lexer<Token>) -> Option<String> {
    lex_embedded_code(lex, "python$")
}

fn lex_embedded_code(lex: &mut logos::Lexer<Token>, end_delimiter: &str) -> Option<String> {
    let start = lex.span().end;
    let source = lex.source();

    if let Some(end_pos) = source[start..].find(end_delimiter) {
        let code = &source[start..start + end_pos];
        lex.bump(end_pos + end_delimiter.len());
        Some(code.to_string())
    } else {
        let code = &source[start..];
        lex.bump(source.len() - start);
        Some(code.to_string())
    }
}

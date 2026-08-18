use logos::Logos;

#[derive(Logos, Debug, PartialEq, Clone)]
pub enum Token {
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
    #[token("import")]
    Import,
    #[token("from")]
    From,

    #[token("->")]
    Arrow,
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
    #[token("[")]
    LeftBracket,
    #[token("]")]
    RightBracket,
    #[token("&")]
    Ampersand,
    #[token(".")]
    Dot,
    #[token("|")]
    Pipe,
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

    #[regex(r#"f"(?:\\.|[^"\\])*""#, lex_fstring)]
    FString(String),
    #[regex(r#""(?:\\.|[^"\\])*""#, lex_string)]
    StringLiteral(String),
    #[regex(r"[0-9]+", |lex| lex.slice().parse::<i64>().ok())]
    Integer(i64),
    #[regex(r"[A-Za-z_][A-Za-z0-9_]*", |lex| lex.slice().to_string())]
    Identifier(String),

    #[token("$rust", lex_rust_code)]
    RustCode(String),
    #[token("$python", lex_python_code)]
    PythonCode(String),

    #[regex(r"[ \t\r]+", logos::skip)]
    #[regex(r"//[^\n]*", logos::skip, allow_greedy = true)]
    #[regex(r"#[^\n]*", logos::skip, allow_greedy = true)]
    #[regex(r"/\*([^*]|\*[^/])*\*/", logos::skip)]
    Skip,

    /// Injected by the indent tokenizer.
    #[token("@@INDENT")]
    Indent,
    #[token("@@DEDENT")]
    Dedent,
    #[token("@@NEWLINE")]
    Newline,
}

fn lex_string(lex: &mut logos::Lexer<Token>) -> Option<String> {
    let slice = lex.slice();
    let unquoted = &slice[1..slice.len() - 1];
    Some(unquoted.to_string())
}

fn lex_fstring(lex: &mut logos::Lexer<Token>) -> Option<String> {
    let slice = lex.slice();
    // f"..."
    let unquoted = &slice[2..slice.len() - 1];
    Some(unquoted.to_string())
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

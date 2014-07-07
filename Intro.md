## Rules

A parser is comprised of a series of rule definitions like this:

    <rule> = <definition> ;

The definition can contain text matchers, combinators, and refer to other rules.

The entry point rule should be named "Start".

    rule = beep boop ;

This rule sequentially matches the text matched by rule "beep" followed by rule "boop".

    rule = beep boop / zap ;

This rule tries to match "beep" followed by "boop", but if either "beep" or "boop" fail to match it will backtrack and try to match "zap" instead.

    rule = beep ( boop / zap ) ;

Put alternatives in parentheses to include them in a sequence.

    rule = beep %anc boop / zap ;

"%anc" is an anchor token. If anything after it in the sequence fails to match, instead of backtracking the parsing will be stopped and a parse error will be issued.

    rule = a:beep b:boop { a: a, b: b } ;

"{..}" is a formating expression, which specifies the JS value the parser will return, using variables bound by qualifiers such as "a:" and "b:".

If the formating expression is omitted, a sequence expression will return the input span that was matched.


## Matching

    "abc"

String expr. Matches the string "abc".

    [a-z !@#]

Range expr. Matches a single character if it is in the in the range a-z or is one of the characters !@#.

    [^ )]

Inverted range expr. Matches any character but ")".

    [a-z]*
    [a-z]+
    [a-z]?

Repetition operators. Specify the number of times a parser may attempt to execute.
* 0 to N times
+ 1 to N times
? 0 or 1 times

"*" and "+" return an array of results. "?" returns either the result or null.

Repetition can be used with any expression, such as "beep+" or "(beep boop)*" or "(beep / boop)?".

As an exception, if the used expression appears to match a string instead of producing a JS value, the repetition expression will return the whole string matched instead of an array of strings:

    ( "a" / "b" )+

Returns something like "aaabbb".

    ( a / b )+

Returns an array of results because rules might produce values.


## Tips

Here are some useful definitions:

    sp = [\ \n\r\t]* ;

Match whitespace

    word = [a-z A-Z 0-9]+ ;

Match a word

    ident = [a-z A-Z _$][a-z A-Z _$ 0-9]* ;

Match a JS identifier

    name:ident sp '=' sp expr:expr ';' sp
    { name: name, expr: expr }

Match a definition

    first:word sp tail:( ',' sp w:word sp { w } )*
    { tail.length ? [first].concat(tail) : [first] }

Match a list of words seperated by commas

(Use more line breaks in your definitions though!)


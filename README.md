# sandbox
Foundation application - knowledge map

Recovered from public domain de facto, on the 7th of April 2024.

# Introduction

sandbox is an XML/XSLT application running on navigators. But when recovering it, I was not able to prompt it - i.e. find the index. In this word shift, we intend to encompass the Test Revolution. We have Turing persons around us. Now. It was not the case in 2018 when this repository ceases to exist. Even if in 2015 an artificial player won the last game that resists to machine, it was more a philosophical matter than a market one. That machine think learns us many things. And I'm deeply sure Alan would be delighted to see what we actually see. He had forceen it: but againt reality, it is something else all together.

At that time, 2018, the focus was elsewhere. The magnificent work of Satoshi was yet shining but its commercial prophet Vitalik chooses a dead end to our eyes — with Turing-Complete contract granularity amendments, so called "smart-contract" [Ú†ßπ]. We won an affair the day after DAO crash in June 2017. Recently, we state that bitcoin solution to contract signature issued in 2021 was a correct response to the commercial sollicitation. There is one chain, *bitcoin* and there are sollicitations from the crypto-DeFI ecosystem. Today, bitcoin is a registered SEC product with arm-long proficiencies. 

With bitcoin should we choose fusion or sollicitation? How do you we state politicial issues like this? For now, crypto-communities are not yet able to propose something alternative to an avatar of mediation. To overcome that structuring limitation, we propose the Romulus Solution, to draw circles on a single surface — a local plane on a sphere with some tunnels or "holes" [EDMNUDS-1959]. We found this method in 2008, and during lock-down, we found an old reference of graphical processing which was it. How to describe this surface? Edmunds wonders, and I, long ago and still, that a simple graph would do. Like Groenthendieck's "Dessin d'Enfant", combinatorial map where drawn graph — the sand interaction pracise that goed from Archimedes to Hypathie (AGORA).

There are "sand drawings" on Vavuatu archipel where every finger track is a loop! You may go many times at the same place to tune the output. In our drawing model, can either draw loops (zero) or stitch links between them (unity). The graph are said "planar" — this means that a syntactic expression from a POV is Turing-Safe. Let's dive right into the syntax: any loop defines a circular order of its stitch intersection. Any stitch intersection is twice spent but no more — this is a serious candidate for overall space/time discret structure:
```
a b d c g h j y t r
k l y h t r g e d s 
p l o k l a f e d s
```
in his paper, Edmunds says that a torus is:
```
a b
a b
```
And that's is a fact.

Our basic contribution is to remark that elementary bitcoin transaction graph is written easily in that context : a cadenced messaging system which bodies are some integers and in brackets, insights to free some these integers. The difference between liberations and consumption is called the "fee" and compensate system growth.
```
10000 3000000 650000 3000000 7882300 (7F54...6A4D:1 98D2...53b1:2 ...)
```

# Wang tiles
The key of Bitcoin security resides on a complexity argument: the language "_Stack_" used to interpret liberating conditions of bitcoin is "_Turing-Safe_". A stack program can not dissimulate any intentions. 

The study of complexity made great progresses considering the questions around tilings. This question emerges in the early sixties by the Wang Conjecture[2](https://mathworld.wolfram.com/WangsConjecture.html) : "_if a set of tiles can tile the plane, then they can always be arranged to do so periodically_". The first set of tiles proving that conjecture to be false had 20426 tiles. This number drop to 2 in the mid-seventies, and to 1 very recently. 

## Wang Braille Tiles
But the order of magnitude of the first Berger set is interesting. It is the same trade-off with regards to vocabulary size for a single language tokenisation: 0x7fff=32767 tokens. This has the benefit of fitting easily within 16 bits, which makes handling tokenized data easier in many cases[3](https://blog.devgenius.io/understanding-tokens-and-tokenization-in-large-language-models-1058cd24b944).
```
U+2800	⠀⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟
U+2820	⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿
U+2840	⡀⡁⡂⡃⡄⡅⡆⡇⡈⡉⡊⡋⡌⡍⡎⡏⡐⡑⡒⡓⡔⡕⡖⡗⡘⡙⡚⡛⡜⡝⡞⡟
U+2860	⡠⡡⡢⡣⡤⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿
U+2880  ⢀⢁⢂⢃⢄⢅⢆⢇⢈⢉⢊⢋⢌⢍⢎⢏⢐⢑⢒⢓⢔⢕⢖⢗⢘⢙⢚⢛⢜⢝⢞⢟
U+28A0	⢠⢡⢢⢣⢤⢥⢦⢧⢨⢩⢪⢫⢬⢭⢮⢯⢰⢱⢲⢳⢴⢵⢶⢷⢸⢹⢺⢻⢼⢽⢾⢿
U+28C0	⣀⣁⣂⣃⣄⣅⣆⣇⣈⣉⣊⣋⣌⣍⣎⣏⣐⣑⣒⣓⣔⣕⣖⣗⣘⣙⣚⣛⣜⣝⣞⣟
U+28E0  ⣠⣡⣢⣣⣤⣥⣦⣧⣨⣩⣪⣫⣬⣭⣮⣯⣰⣱⣲⣳⣴⣵⣶⣷⣸⣹⣺⣻⣼⣽⣾⣿
```
At this stage, we will assume that you have opened [2](https://mathworld.wolfram.com/WangsConjecture.html) elsewhere. We will consider 4x4 bits Wang tiles and number the bits with the braille convention. Wang tiles do not rotate. A tile can be written as two braille characters (U+28..). 
```
0 3 8 B
1 4 9 C
2 5 A D
6 7 E F
```
Encoding WRGB as 00,01,10,11, the _11 Quadrichrome Wang Tiles_ set is written:
```
- 0 0 -   - 0 0 -   - 0 1 -   - 0 1 -   - 0 1 -   - 0 1 -
0 - - 0   1 - - 1   0 - - 1   1 - - 0   1 - - 0   1 - - 1
0 - - 0   1 - - 1   0 - - 0   0 - - 0   0 - - 1   0 - - 0   
- 0 1 -   - 0 1 -   - 1 1 -   - 0 1 -   - 0 1 -   - 1 0 -

- 1 1 -   - 0 0 -   - 1 1 -   - 1 1 -   - 1 0 -
0 - - 0   0 - - 0   1 - - 1   1 - - 0   0 - - 1
1 - - 0   1 - - 1   1 - - 1   0 - - 1   1 - - 0 
- 1 1 -   - 0 0 -   - 0 0 -   - 1 1 -   - 1 1 -
```
Which in braille is very compact...

## Wang Filets Tiles.
 But our field if study is more to use _filets_, like in the old days.
```
U+2500	─━│┃┄┅┆┇┈┉┊┋┌┍┎┏┐┑┒┓└┕┖┗┘┙┚┛├┝┞┟
U+2520	┠┡┢┣┤┥┦┧┨┩┪┫┬┭┮┯┰┱┲┳┴┵┶┷┸┹┺┻┼┽┾┿
U+2540 ╀╁╂╃╄╅╆╇╈╉╊╋╌╍╎╏═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟
U+2560	╠╡╢╣╤╥╦╧╨╩╪╫╬╭╮╯╰╱╲╳╴╵╶╷╸╹╺╻╼╽╾╿
```
Encoding _11 Quadrichrome Wang Tiles_ with filets could give:
```
                  ╭───────────────────╮
╯     ╰   ╯     ╰ │ ╯   │ ╰   ╯   │ ╰ │ ╯   │ ╰   ╯   │ ╰
  ╭─╮     ─────── │     ├──   ────┤╳  │ ────┤     ──┬─┴──
  ╰─┤     ────┬── │   ╭─┤         │   │     ├──     │       
╮   │ ╭   ╮   │ ╭ │ ╮ │ │ ╭   ╮   │ ╭ │ ╮   │ ╭   ╮ │   ╭
                  │         ╭─────────┴─────────╮
╯ │ │ ╰   ╯     ╰ │ ╯ │ │ ╰ │ ╯ │ │ ╰   ╯ │   ╰ │
  │ │             │ ──╯ ╰── │ ──┤ │       │ ╭── │
──┤ │     ─────── │ ─────── │   │ ├──   ──┤ │   │
╮ │ │ ╭   ╮     ╭ │ ╮     ╭ │ ╮ │ │ ╭   ╮ │ │ ╭ │
                  ╰─────────┴───────────────────╯
```

First, we treat the corners with _percolation tiles_[Hooper]: ╭╮╯╰. Tiling with such tiles is equivalent to Hitomezachi[1]. As colors are encoded as two ray of light from an external observer, we will keep horizontals and verticals at most. Horizontal bar is the first character. In in given category of filet, the first one is the plain one. At the end, we had bubbles to express the largest continuous patterns, that contains insights for the following discussion and a check tool against original.

Our one main argument for more than a decade is to remark that there is only four even tile "├┬─┴┤" and the rest is even. Lucky that the first tile embodies the main concept of our most recent engine: the _document_. Cool. Now, we will do a very common experience to topologist, suppose an ╳ agent, not necessarly a person, which lives in this 2D world. The cosmos is planar, you have a left and a right. Suppose our little guy at a three road intersection, ┴. He has a left, a right and path. What educated guess can this agent do?

There are two options if the agent follows the path in front of him: it is a **link** if this path hits a path or return as a _qualified_ **document**. The qualification depends on the side of the return: _left_, _right_ or _forward_ **document**. Forward can be distinguised in left forward and right forward. So basically, this structure is a planar _Hypertext Document System_: ╳ is a _link_, the first tile is a _right document_, the bubbles are two _right documents_.

# Bibliography

[1] for "hitomezachi" stitching on Japanese isles, see [Ò†®†Ò]

[2] Pegg, Ed Jr. and Weisstein, Eric W. "Wang's Conjecture." 
From MathWorld--A Wolfram Web Resource.

[3] Michael Humor, "Understanding “tokens” and tokenization in large language models", DevGenius 2023.


[Hooper-2006] Hooper, Percolation tiles

[EDMNUDS-1959] Jack Edmonds, « A Combinatorial Representation for Polyhedral Surfaces »,
Notices Amer. Math. Soc., vol. 7,‎ 1960 , p. 646-650.





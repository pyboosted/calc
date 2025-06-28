# Boosted Calculator Examples

## Basic Math
```
# Basic math
2 + 2
10 - 5
3 * 4
20 / 4
2 ^ 3
10 % 3

# Functions
sqrt(16)
sin(0)
round(3.14159, 2)
```

## Number Formats (v1.5.1)
```
# Binary literals
0b1010          # 10
0b11111111      # 255
0b0             # 0

# Hexadecimal literals
0xFF            # 255
0x10            # 16
0xDEADBEEF      # 3735928559

# Base conversions
10 to binary    # 0b1010
255 to hex      # 0xff
0xFF to decimal # 255
0b1111 to hex   # 0xf

# Mixed operations
0xFF + 10       # 265
0b1010 * 5      # 50
0x100 - 0xFF    # 1

# Negative numbers
-10 to binary   # -0b1010
-255 to hex     # -0xff
```

## Unit Conversions
```
100 cm in meters
32 fahrenheit in celsius
1 gb in mb
20 ml in teaspoons
```

## Dimensional Analysis (v1.4.0)
```
# Velocity calculations
distance = 100m
time = 10s
velocity = distance / time       # 10 m/s
velocity to km/h                 # 36 km/h

# Physics calculations
mass = 5kg
acceleration = 2 m/s²
force = mass * acceleration      # 10 N (Newton)

# Energy and power
work = force * 10m               # 100 J (Joule)
power = work / 5s                # 20 W (Watt)

# Compound unit conversions
60 km/h to m/s                   # 16.667 m/s
1 kWh to J                       # 3.6e6 J
1000 Pa to bar                   # 0.01 bar
```

## Currency Conversions
```
# Currency conversions (live rates)
100 USD in EUR
50 EUR in GBP
(100 USD + 50 EUR) in JPY
```

## Variables
```
# Variables
x = 10
y = 20
x + y
sqrt(x^2 + y^2)

# Unicode variable names (including Cyrillic)
цена = 1500
скидка = 10%
цена - скидка

# Variables with date/time arithmetic
test = 2
test * 1 day + today
num = 5
tomorrow + num * 1 week
```

## Previous Result and Aggregates
```
# Using previous result
10 + 5
prev * 2
prev - 5
# Comment line doesn't affect prev
prev / 3

# Aggregate operations
100
200
300
total          # 600
agg | avg      # 200 (new syntax for average)

# With grouping
85
90
95
agg | avg      # 90 (average of previous results)

Comment or empty line breaks the group
50
total          # 50 (only counts this line)
```

## Percentages
```
# Percentages
20%
100 - 10%
100 + 10%
20% of 500
50% * 100
25% + 25%
```

## Date Operations
```
# Date operations
today
tomorrow
today + 5 days
now + 2 hours
tomorrow - 1 week
monday + 3 days

# Date literals (DD.MM.YYYY or DD/MM/YYYY)
25.10.1988
01/01/2025
25/07/2025 - today in days
01.01.2025 + 30 days
birthday = 25.10.1988
today - birthday in days

# Time and timezone operations
12:00                          # Current timezone
10:30@utc                      # UTC time
12:00@moscow                   # Moscow time
15:45@new york                 # New York time
12:00@moscow in utc            # Convert to UTC
now in yerevan                 # Current time in Yerevan
12:15 - 10:00 in minutes       # Time difference
25.10.2025T12:15@moscow        # DateTime with timezone

# Smart time formatting
2.5 hours                      # Displays as "2h 30min"
150 minutes                    # Stays as "150 minutes" (whole number)
2.5 weeks                      # Displays as "2w 3d 12h"
3.5 months                     # Displays as "3mo 15d 5h 15min"
100.5 days                     # Displays as "3mo 9d 12h"

# Time calculations with units
rent = 100 USD / month
money = 256 USD
money / rent                   # 2.56 months → displays as "2mo 17d 2h 24min"
```

## Comments and Organization
```
Calculate monthly budget:

Income
1500 + 2000

Expenses
rent = 800
food = 300
utilities = 150
rent + food + utilities

Remaining
3500 - 1250
```

## String Operations (v1.3.0)
```
# String literals
`Hello, World!`                        # Backticks with interpolation
'Single quotes'                        # No interpolation
"Double quotes"                        # No interpolation

# String interpolation
name = `John`
greeting = `Hello, ${name}!`
x = 10
message = `The value is ${x * 2}`

# String concatenation
`Hello` + ` ` + `World`
"Hello" + 123                          # "Hello123"
123 + " items"                         # "123 items"

# String repetition
`=` * 50                               # Creates a line of 50 equals signs
"abc" * 3                              # "abcabcabc"

# String subtraction (suffix removal)
`report_2025.txt` - `.txt`             # "report_2025"
"hello world" - " world"               # "hello"

# Type casting
num_str = 123 as string                # "123"
str_num = `456` as number              # 456
pi_str = 3.14159 as string             # "3.14159"

# String functions
# Length and access
len(`Hello`)                           # 5
substr(`Hello, World!`, 0, 5)          # "Hello"
substr(`Hello, World!`, 7)             # "World!"
charat(`Hello`, 1)                     # "e"

# Case transformation
uppercase(`hello world`)               # "HELLO WORLD"
upper(`hello`)                         # "HELLO" (alias)
lowercase(`HELLO WORLD`)               # "hello world"
lower(`HELLO`)                         # "hello" (alias)
capitalize(`hello world`)              # "Hello world"

# Trimming
trim(`  spaces  `)                     # "spaces"

# String checking
startswith(`hello world`, `hello`)     # true
endswith(`report.pdf`, `.pdf`)         # true
includes(`hello world`, `lo wo`)       # true
contains(`hello world`, `world`)       # true (alias)

# String manipulation
replace(`hello hello`, `hello`, `hi`)  # "hi hello"
replaceall(`hello hello`, `hello`, `hi`) # "hi hi"
split(`a,b,c`, `,`)                    # ["a", "b", "c"]
join([`a`, `b`, `c`], `-`)             # "a-b-c"
reverse(`hello`)                       # "olleh"

# String padding
padleft(`5`, 3, `0`)                   # "005"
padstart(`abc`, 5, `*`)                # "**abc" (alias)
padright(`hello`, 10, `.`)             # "hello....."
padend(`abc`, 5, `*`)                  # "abc**" (alias)

# Finding substrings
indexof(`hello world`, `world`)        # 6
lastindexof(`abcabc`, `abc`)           # 3

# Practical examples
# Email validation
email = `user@example.com`
includes(email, `@`) and includes(email, `.`)  # true

# File extension checking
filename = `report_2025.pdf`
endswith(filename, `.pdf`) ? `PDF file` : `Other file`  # "PDF file"

# Name formatting
name = `john doe`
capitalize(name)                       # "John doe"
join(map(split(name, ` `), capitalize), ` `)  # "John Doe"

# String cleaning
text = `  HELLO   WORLD  `
text | trim | lower | replace(`  `, ` `)  # "hello world"

# Number formatting with padding
invoice = 42
`INV-${padleft(invoice as string, 6, `0`)}`  # "INV-000042"

# Date formatting with strings
today_str = format(today, `dd/MM/yyyy`)
time_str = format(now, `HH:mm:ss`)
custom = format(today, `'Today is' EEEE`)

# Escape sequences
`Line 1\nLine 2`                       # Newline
`Column1\tColumn2`                     # Tab
`Path\\to\\file`                       # Backslashes
`She said \`hello\``                   # Backticks
```

## Boolean Operations (v1.3.1)
```
# Boolean literals
true
false
null

# Comparison operators
5 == 5                                 # true
5 != 10                                # true
10 > 5                                 # true
5 < 10                                 # true
5 <= 5                                 # true
10 >= 10                               # true

# String comparisons
`abc` == `abc`                         # true
`abc` < `def`                          # true
`hello` != `world`                     # true

# Unit comparisons
100 cm == 1 m                          # true
1000 g < 2 kg                          # true
32 °F == 0 °C                          # true

# Logical operators
true and true                          # true
true and false                         # false
false or true                          # true
not true                               # false
5 > 3 and 10 < 20                      # true

# Short-circuit evaluation
false and x/0                          # false (doesn't evaluate x/0)
true or expensive_calculation          # true (doesn't evaluate calculation)

# Ternary operator
x = 10
x > 5 ? `big` : `small`                # "big"
is_member = true
price = is_member ? 90 : 100           # 90

# Type conversions
true as number                         # 1
false as number                        # 0
0 as boolean                           # false
1 as boolean                           # true
`` as boolean                          # false (empty string)
`hello` as boolean                     # true
null as boolean                        # false

# Truthiness in conditionals
count = 0
count ? `has items` : `empty`          # "empty"
name = `John`
name ? `Hello, ${name}` : `Guest`      # "Hello, John"

# Complex expressions
age = 25
is_adult = age >= 18
is_senior = age >= 65
discount = is_adult and not is_senior ? 10 : 0

# String aggregation
`Hello`
` `
`World`
total                                  # "Hello World"
```

## Arrays and Objects (v1.3.2)
```
# Array literals
[1, 2, 3]                              # Array of numbers
["a", "b", "c"]                        # Array of strings
[1, "hello", true]                     # Mixed types
[]                                     # Empty array
[[1, 2], [3, 4]]                       # Nested arrays

# Object literals
{x: 10, y: 20}                         # Object with properties
{"name": "John", "age": 30}            # String keys
{a: 1, b: "hello", c: true}            # Mixed value types
{}                                     # Empty object
{person: {name: "John", age: 30}}      # Nested objects

# Array functions
arr = [1, 2, 3]
push(arr, 4)                           # [1, 2, 3, 4] (returns new array, arr is unchanged)
push(arr, 4, 5)                        # [1, 2, 3, 4, 5] (can push multiple items)
pop([1, 2, 3])                         # [1, 2] (returns new array without last element)
pop([])                                # [] (empty array returns empty)
shift([1, 2, 3])                       # [2, 3] (removes first element)
unshift([2, 3], 1)                     # [1, 2, 3] (adds at beginning)
unshift([3], 1, 2)                     # [1, 2, 3] (can add multiple items)
append([1, 2], [3, 4])                 # [1, 2, 3, 4] (concatenates arrays)
prepend([3, 4], [1, 2])                # [1, 2, 3, 4] (prepends second array)
first(arr)                             # 1
last(arr)                              # 3
slice(arr, 1, 2)                       # [2]
length(arr)                            # 3
sum([1, 2, 3, 4])                      # 10
avg([10, 20, 30])                      # 20

# Difference between push and append
arr = [1, 2, 3]
push(arr, [4, 5])                      # [1, 2, 3, [4, 5]] (adds array as element)
append(arr, [4, 5])                    # [1, 2, 3, 4, 5] (concatenates arrays)

# Find functions
numbers = [1, 5, 10, 15, 20]
find(numbers, x => x > 10)             # 15 (first element > 10)
find(numbers, x => x > 100)            # null (no match found)
findIndex(numbers, x => x > 10)        # 3 (index of 15)
findIndex(numbers, x => x > 100)       # -1 (no match found)

# Find with objects
users = [{name: "Alice", age: 25}, {name: "Bob", age: 30}]
find(users, u => u.age > 28)           # {name: "Bob", age: 30}
findIndex(users, u => u.name == "Alice") # 0

# Mutation functions (functions ending with !)
# These modify the array in place and return the modified array
arr = [1, 2, 3]
push!(arr, 4)                          # [1, 2, 3, 4] (arr is mutated)
arr                                    # [1, 2, 3, 4]

arr = [1, 2, 3, 4]
pop!(arr)                              # [1, 2, 3] (arr is mutated)
arr                                    # [1, 2, 3]

arr = [1, 2, 3, 4]
shift!(arr)                            # [2, 3, 4] (removes first element, arr is mutated)
arr                                    # [2, 3, 4]

arr = [2, 3, 4]
unshift!(arr, 1)                       # [1, 2, 3, 4] (adds at beginning, arr is mutated)
arr                                    # [1, 2, 3, 4]

arr1 = [1, 2, 3]
arr2 = [4, 5, 6]
append!(arr1, arr2)                    # [1, 2, 3, 4, 5, 6] (arr1 is mutated)
arr1                                   # [1, 2, 3, 4, 5, 6]
arr2                                   # [4, 5, 6] (unchanged)

arr1 = [3, 4, 5]
arr2 = [1, 2]
prepend!(arr1, arr2)                   # [1, 2, 3, 4, 5] (arr1 is mutated)
arr1                                   # [1, 2, 3, 4, 5]

arr = [1, 2, 3, 4, 5]
slice!(arr, 1, 4)                      # [2, 3, 4] (arr is mutated to contain only slice)
arr                                    # [2, 3, 4]

arr = [1, 2, 3, 4, 5]
filter!(arr, x => x > 2)               # [3, 4, 5] (arr is mutated)
arr                                    # [3, 4, 5]

arr = [1, 2, 3]
map!(arr, x => x * 2)                  # [2, 4, 6] (arr is mutated)
arr                                    # [2, 4, 6]

# Comparison: mutating vs non-mutating
original = [1, 2, 3]
new_arr = push(original, 4)            # Returns [1, 2, 3, 4]
original                               # Still [1, 2, 3]

original = [1, 2, 3]
push!(original, 4)                     # Returns [1, 2, 3, 4]
original                               # Now [1, 2, 3, 4]

# Object functions
obj = {a: 1, b: 2, c: 3}
keys(obj)                              # ["a", "b", "c"]
values(obj)                            # [1, 2, 3]
has(obj, "b")                          # true
has(obj, "x")                          # false

# Property access
arr = [10, 20, 30]
arr[0]                                 # 10 (bracket notation)
arr.1                                  # 20 (dot notation)
obj = {name: "John", age: 30}
obj.name                               # "John"
obj["age"]                             # 30

# Dynamic property access
key = "name"
obj[key]                               # "John"
index = 2
arr[index]                             # 30

# Nested access
data = {users: [{name: "John"}, {name: "Jane"}]}
data.users[0].name                     # "John"
data["users"][1]["name"]               # "Jane"

# Type casting with JSON
json_arr = `[1, 2, 3]`
parsed = json_arr as array             # [1, 2, 3]
json_obj = `{"x": 10, "y": 20}`
parsed_obj = json_obj as object        # {x: 10, y: 20}

# Arrays/objects to string
[1, 2, 3] as string                    # "[1,2,3]"
{a: 1, b: 2} as string                 # "{\"a\":1,\"b\":2}"

# sum and avg as array functions
sum([1, 2, 3, 4])                      # 10
avg([10, 20, 30])                      # 20

# For aggregate operations, use agg with pipe:
10
20
30
agg | sum                              # 60 (sum of previous results)
agg | avg                              # 20 (average of previous results)
```

## Environment Variables and Arguments (v1.3.6)
```
# Environment variables
# Read environment variables
env("HOME")                            # "/Users/username"
env("PATH")                            # System PATH
env("MISSING_VAR")                     # null

# Type conversion with env
port = env("PORT") as number           # Convert to number
port + 1000                            # 4000 (if PORT=3000)
debug = env("DEBUG") as boolean        # Convert to boolean

# Command-line arguments
# Read from stdin or --arg flag
arg()                                  # Reads stdin data or --arg value

# Type conversion with arg
data = arg() as object                 # Parse JSON object
items = arg() as array                 # Parse JSON array
value = arg() as number                # Convert to number

# Practical examples:
# 1. Process JSON data from stdin
# echo '{"price": 100, "tax": 0.08}' | calc -e "data = arg() as object" -e "data.price * (1 + data.tax)"

# 2. Use environment for configuration
# NODE_ENV=production calc -e "env(\"NODE_ENV\") == \"production\" ? \"prod\" : \"dev\""

# 3. Pipeline with output mode
# calc price-calc.calc -o | calc -e "arg() * 0.9"  # Apply 10% discount
```

## Compound Assignment (v1.3.5)
```
x = 10
x += 5                                 # 15
x -= 3                                 # 12
x *= 2                                 # 24
x /= 4                                 # 6

# Works with all types
text = "file"
text += ".txt"                         # "file.txt"
arr = [1, 2]
arr += [3, 4]                          # [1, 2, 3, 4]
```

## User-Defined Functions (v1.4.1)
```
# Simple function definitions
double(x) = x * 2
square(x) = x * x
max(a, b) = a > b ? a : b

double(5)                              # 10
square(4)                              # 16
max(10, 7)                             # 10

# Recursive functions
fact(n) = n <= 1 ? 1 : n * fact(n-1)
fib(n) = n <= 1 ? n : fib(n-1) + fib(n-2)

fact(5)                                # 120
fib(10)                                # 55

# Functions with units
to_meters(value) = value to m
velocity(dist, time) = dist / time

to_meters(100 cm)                      # 1 m
velocity(100m, 10s)                    # 10 m/s

# Type checking functions
is_positive(n) = n > 0
is_even(n) = n % 2 == 0

is_positive(-5)                        # false
is_even(42)                            # true

# Function composition
double_square(x) = double(square(x))
double_square(3)                       # 18 (3² * 2)

# Mutual recursion
is_even_num(n) = n == 0 ? true : is_odd_num(n - 1)
is_odd_num(n) = n == 0 ? false : is_even_num(n - 1)

is_even_num(4)                         # true
is_odd_num(7)                          # true

# Function references
square                                 # <function square(x)>
my_func = square                       # Store function in variable
my_func(5)                             # 25
```

## Lambda Functions (v1.4.3)
```
# Filter array elements
filter([1, -2, 3, -4, 5], x => x > 0)  # [1, 3, 5]
filter(["a", "", "b"], s => s)         # ["a", "b"] (truthy values)

# Transform array elements
map([1, 2, 3], x => x * x)             # [1, 4, 9]
map(["hello", "world"], s => len(s))   # [5, 5]

# Reduce array to single value
reduce([1, 2, 3, 4], (acc, x) => acc + x, 0)  # 10
reduce(["a", "b", "c"], (acc, s) => acc + s, "")  # "abc"

# Sort array with custom comparator
sort([3, 1, 4, 1, 5], (a, b) => a - b) # [1, 1, 3, 4, 5]
sort(["banana", "apple"], (a, b) => a > b ? 1 : -1)  # ["apple", "banana"]

# Group array by key
groupBy([1, 2, 3, 4, 5], x => x % 2 == 0)  # {"true": [2, 4], "false": [1, 3, 5]}
items = [{type: "A", val: 1}, {type: "B", val: 2}, {type: "A", val: 3}]
groupBy(items, item => item.type)     # {"A": [{...}, {...}], "B": [{...}]}

# Lambda stored in variable
double = x => x * 2
add = (a, b) => a + b
map([1, 2, 3], double)                 # [2, 4, 6]

# Lambda in user-defined functions
any(arr, pred) = reduce(arr, (acc, x) => acc or pred(x), false)
any([1, 2, 3], x => x > 2)             # true

all(arr, pred) = reduce(arr, (acc, x) => acc and pred(x), true)
all([2, 4, 6], x => x % 2 == 0)       # true
```

## Pipe Operator (v1.4.5)
```
# Basic piping
[1, 2, 3, 4, 5] | sum                  # 15
[10, 20, 30] | avg                     # 20

# Chain operations
"  hello world  " | trim | len         # 11
[1, 2, 3] | map(x => x * x) | sum      # 14

# With user-defined functions
double(x) = x * 2
5 | double                             # 10
[1, 2, 3] | map(double) | sum          # 12

# With higher-order functions
numbers = [1, -2, 3, -4, 5]
numbers | filter(x => x > 0) | sum     # 9
numbers | filter(x => x > 0) | map(x => x * x) | sum  # 35

# String processing
text = "  HELLO WORLD  "
text | trim | substr(0, 5)             # "HELLO"

# Unit preservation
distances = [10m, 20m, 30m]
distances | sum                        # 60 m
distances | avg                        # 20 m

# Mixed units
weights = [1000g, 2kg, 500g]
weights | sum                          # 3500 g

# Multi-line with aggregates
100
200
300
agg | sum                              # 600
agg | filter(x => x > 150) | sum       # 500

# Complex pipelines
orders = [
  {price: 100, qty: 2},
  {price: 50, qty: 3},
  {price: 25, qty: 4}
]
orders | map(o => o.price * o.qty) | sum  # 450

# Practical examples
expenses = [120, 80, 200, 150, 90]
expenses | filter(x => x > 100)        # [120, 200, 150]
expenses | filter(x => x > 100) | avg  # 156.67
expenses | map(x => x * 1.1) | sum     # 704 (with 10% increase)
```

## Nullish Coalescing Operator (v1.4.5)
```
# Basic usage
null ?? 42                             # 42 (null is replaced)
0 ?? 42                                # 0 (zero is not null)
false ?? true                          # false (false is not null)
"" ?? "default"                        # "" (empty string is not null)

# With variables
config = null
config ?? "default config"             # "default config"

# Different from || operator
# || treats all falsy values as false
0 || 42                                # 42 (|| treats 0 as falsy)
0 ?? 42                                # 0 (?? only checks for null)

false || true                          # true (|| treats false as falsy)
false ?? true                          # false (?? only checks for null)

"" || "default"                        # "default" (|| treats "" as falsy)
"" ?? "default"                        # "" (?? only checks for null)

# Chaining defaults
userPreference ?? systemDefault ?? "fallback"

# Real-world examples
# Default configuration values
timeout = config.timeout ?? 5000
retries = config.retries ?? 3

# Safe array/object access
arr = [1, 2, 3]
arr[10] ?? 0                           # 0 (out of bounds returns null)

obj = {name: "John", age: 30}
obj.email ?? "no-email@example.com"   # "no-email@example.com"

# Combine with other operators
(user.discount ?? 0) * price           # Safe discount calculation
items | map(i => i.price ?? 0) | sum   # Sum with null-safe prices
```
---
toc_max_heading_level: 5
---

# TypeScript

TypeScript is a superset of JavaScript, meaning all JavaScript is valid TypeScript, but not all
TypeScript is valid JavaScript. It has been in the top 5 most loved languages in the StackOverflow
developer survey for years.

Microsoft created TypeScript in 2010 because of the shortcomings of JavaScript. It is a statically
typed language; types are known at compile time. This allows for better tooling and more robust code
as it is easier to catch bugs early on.

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

## When to use?

For many teams a no-brainer, for others a tough decision.

Here are some of the pros and cons to using TypeScript in your codebase:

| Pro                                                                                                                         | Con                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| You are forced to write better code, that is easier to understand; reducing cognitive complexity.                           | Comes at the cost of a small learning curve. You also end up writing and reviewing slightly more code. |
| ESLint rules based on the syntactic sugar of TypeScript lead to further improved code quality.                              | Lends itself less well for prototyping.                                                                |
| Developers find out about bugs in their IDE instead of in production                                                        | Sometimes refactors may be needed to align the signature of the code                                   |
| Hiring and retention of developers is easier. Candidates sometimes lose interest when they hear you're not using TypeScript | New developers might need more time to get up and running in case they haven't used TypeScript before. |

## Concepts

These are the things I picked up (over time) while learning TypeScript.

### Types

#### Basic types

TypeScript has three basic types; `number`, `string` and `boolean`.

```ts
let myNumber: number
let myString: string
let myBoolean: boolean
```

JavaScript has no notion of integers, floats, doubles, etc. Therefor all numbers are `number` in
TypeScript.

To illustrate this, let's compare TypeScript types with C# types:

|                |        |        |      |        |        |        |        |        |        |        |        |        |        |        |
| -------------: | ------ | ------ | ---- | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
|         **C#** | string | char   | bool | object | byte   | sbyte  | short  | ushort | int    | uint   | double | float  | long   | ulong  |
| **TypeScript** | string | string | bool | object | number | number | number | number | number | number | number | number | bigint | bigint |

This is part of the reason the learning curve of TypeScript is so small.

#### Complex types

More complex types can be created by combining these basic types.

```ts
let myNumberArray: number[]

let myObject: {
  name: string
  age: number
  isDeveloper: boolean
}
```

#### Special types

TypeScript has a few special types:

- `any`: This type can be anything. It is the default type when no type is specified.
- `unknown`: This type can be anything, but you have to check the type before using it.
- `never`: This type can never be reached. It is used for functions that always throw an error or
  never return.
- `void`: This type is used for functions that do not return anything.

#### Defining types

You can define types using `type` and `interface`.

- Use `interfaces` to define the shape of objects.
- Use `type` to define everything else.

```ts
type MyNamedNumber = number

interface Person {
  name: string
  age: number
}
```

:::info

Interfaces can be merged and extended, types can not.

```ts
interface Person {
  name: string
}

interface Person {
  age: number
}

interface Friend extends Person {
  hobbies: string[]
}

const john: Friend = {
  name: 'John',
  age: 87,
  hobbies: ['cards club', 'watching Twitch streams'],
}
```

:::

#### Type usage

Using types in TypeScript is relatively lightweight. Most types are inferred and don't need to be
set explicitly.

The most important places to use types are:

- Function parameters
- Function return types
- To define the shape of objects

```ts
function add(a: number, b: number): number {
  return a + b
}

interface Person {
  name: string
  age: number
}

function getPerson(): Person {
  return { name: 'John', age: 42 }
}
```

:::info Hidden complexity in JavaScript

Types solve hidden complexity in your code. Here is an oversimplified JavaScript example to
illustrate implicit type conversion.

```js
const double = (x) => {
  return x + x
}

double(true) // returns 2
double('2') // returns '22'
```

In the real world, these bugs are often hidden in a function that is called deep in your code.

:::

#### Union types

Union types are a way to define a variable that can be one of multiple types.

```ts
type Result = string | number | boolean
```

or more specific:

```ts
type Result = 'success' | 'error' | 'warning'
```

#### Map types

Using a map to represent a union type.

```ts
const performanceMap = {
  low: 1,
  medium: 2,
  high: 3,
}

type Performance = keyof typeof performanceMap
```

#### Enums

Enums are a way to define a set of named constants. They are often used to define a set of options.

```ts
enum Color {
  Red,
  Green,
  Blue,
}

let myColor: Color = Color.Green
```

:::info Reverse lookup

Sometimes you may want to parse a number into an enum value and look up the name of that enum value.

```ts
enum Verbosity {
  quiet = -1,
  normal = 0,
  verbose = 1,
  veryVerbose = 2,
  debug = 3,
}

const input: number = 2 // This value is read from CLI input or a config file

const verbosity = Verbosity[Verbosity[input]] // 2

if (verbosity > Verbosity.normal) {
  console.log('Verbosity:', Verbosity[verbosity]) // Output: "Verbosity: veryVerbose"
}
```

#### Record

The `Record` type creates a new object with the given keys and values.

```ts
function getPerson(): Record<string, number> {
  return { age: 42, ageTomorrow: 43 }
}
```

:::

#### Type guards

Type guards are a way to check the type of variable at runtime.

```ts
function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}
```

### Utility types

TypeScript has a few useful utility types.

#### Partial

The `Partial` type makes all properties of an object optional.

```ts
interface Person {
  name: string
  age: number
}

function getPerson(): Partial<Person> {
  return { name: 'John' }
}
```

#### Required

The `Required` type makes all properties of an object required.

```ts
interface Person {
  name: string
  phoneNumber?: string // This property is normally optional
}

function setPerson(person: Required<Person>) {
  // ...
}
```

#### Readonly

The `Readonly` type makes all properties of an object readonly.

This can be especially useful for immutable data structures.

```ts
interface Person {
  name: string
  age: number
}

function getPerson(): Readonly<Person> {
  return { name: 'John', age: 42 }
}
```

#### Pick

The `Pick` type picks a subset of properties from an object.

```ts
interface Person {
  name: string
  age: number
  isDeveloper: boolean
}

function getPerson(): Pick<Person, 'name' | 'age'> {
  return { name: 'John', age: 42 }
}
```

#### Omit

The `Omit` type omits a subset of properties from an object.

```ts
interface Person {
  name: string
  age: number
  isDeveloper: boolean
}

function getPerson(): Omit<Person, 'isDeveloper'> {
  return { name: 'John', age: 42 }
}
```

#### Exclude

The `Exclude` type excludes a subset of types from a union type.

```ts
type MyType = string | number | boolean

function getPerson(): Exclude<MyType, boolean> {
  return 42
}
```

#### Extract

The `Extract` type extracts a subset of types from a union type.

```ts
type MyType = string | number | boolean

function getPerson(): Extract<MyType, boolean> {
  return true
}
```

### Type assertions

Type assertions are a way to tell the compiler that you know more about the type than it does.

```ts
interface Person {
  name: string
  age: number
}

const john = { name: 'John' } as Person
```

TypeScript now thinks the object has `age: number` but it doesn't. This can lead to bugs in runtime.

:::warning Type assertions

Type assertions are often a sign of a design flaw in your code. Don't use them unless you have to.

:::

### Generics

Generics are a way to define types that are not known yet. They are often used in combination with
arrays and promises.

```ts
async function getFirst<T>(array: T[]): Promise<T> {
  return array[0]
}
```

Generics can add complexity to your code. Don't overuse them.

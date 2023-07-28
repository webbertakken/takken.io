# Error handling

Create ubiquitous language around errors.

## Rationale

In short, there are basically 3 types of errors:

- Bugs in the code (Application Errors)
- Bugs that are expected as part of business logic (Business Errors)
- Bugs caused by the environment (e.g. Network Errors, or sometimes also Application Errors)

One may then use this rule of thumb:

- Business Errors MUST be handled as part of the code and are never thrown (to prevent blowing up
  the application)
- Application Errors are thrown and blow up the application - they are usually caught during local
  tests or in the CI workflows, often in end-to-end tests.

## The gap

Note that there's a 4th type of error as well and this is a common pitfall:

- When code was made to throw, but really it should have been written as part of the _domain_.

Let me try to illustrate and example of this:

### Variant 1

```ts
// this might throw (implicit logic)
const compareVariant1 = (input: number) => {
  return numberOpterationThatThrowsOnNonPositiveIntegers(input)
}

const higherLevelLogic = () => {
  try {
    return compareVariant1(15) && compareVariant1(-15)
  } catch (error) {
    console.log(error)
    return false
  }
}
```

### Variant 2

```ts
// this will never throw unless your application has a bug (explicit logic)
const compareVariant2 = (input: number) => {
  if (number < 0) {
    console.error('descriptive error indication by developer')
    return false
  }

  return numberOpterationThatThrowsOnNonPositiveIntegers(input)
}

const higherLevelLogic = () => {
  return compareVariant2(15) && compareVariant2(-15)
}
```

### Explanation

As you can see or deduce: variant 2 is closer to the domain (goes to DDD) and has less cognitive
complexity:

- `higherLevelLogic` becomes much more readable,
- `compareVariant2` uses the pattern of _early returns_ and
- Tracing the error message from `compareVariant2` is now potentially much easier.

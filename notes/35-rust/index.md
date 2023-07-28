# Rust

## Resources

- [Rust Book](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Crates.io](https://crates.io/) (Rust package registry)
- Discord ([community 1](https://discord.gg/rust-lang),
  [community 2](https://discord.com/invite/rust-lang-community))

## Concepts

These are the things I picked up (over time) while learning Rust.

### Mutability

- Mutability is a first class concept in Rust. Values by default can not be mutated. You’ll need to
  add the `mut` keyword for that.

```rust
let foo = 1 // immutable
let mut bar = 2 // mutable
```

- References are by default also not mutable.

```rust
// Given mutable string
let mut s1 = String::from("foo");
```

```rust
// Example 1
fn side_effect(string: &String) {
    println!("{}", string);
}

// pass s1 by (immutable) reference
side_effect(&s1);
```

```rust
// Example 2
fn function_that_updates_string(string: &mut String) {
    // The * gives mutable access to the variables value.
    *string = string.to_string();
}

// pass s1 by (mutable) reference
function_that_updates_string(&mut s1);
```

### Ownership

- Each value has an owner (a value is tied to a variable), there is only one owner of a value (other
  variables can borrow). The value gets dropped when the owner goes out of scope.

```rust
fn move_value_to_new_pointer() {
    let s1 = String::from("abc");
    //  -- move occurs because `s1` has type `String`, which does not implement the `Copy` trait

    let s2 = s1;
    //       -- value moved here (s1 no longer points to the value)

    // println!("{}", s1);
    // Error:         ^^ value borrowed here after move
}

fn copy_value_to_new_pointer() {
    let s1 = String::from("abc");
    let s2 = s1.clone();

    println!("{} and {}", s1, s2);
    // Outputs: "abc and abc"
}
```

### Closures

Closures, in some languages called anonymous functions, are very powerful in Rust. It’s important to
know how they behave about ownership as well.

```rust
// Example closure
|x, y| x + y

// Left-hand side will automatically borrow a referene to values in the enclosing scope
|| x + y
```

```rust
// Any owned type
let s = String::from("🐈");

// Optionally clone to preserve the original
let s2 = s.clone();

// You can move values using the move keyword, so that they are owned by the closure.
let f = move || println!("{}", s2);

// Compilation error: value of s2 has moved to a different variable (that inside of the closure).
println!("{}", s2);

// Invoke the closure
f(); // prints "🐈"
```

### Return signatures

- `Option` and `Result` types, and `unwrap()` shorthand
  - Great explanation by Jake Dawkins
    [https://jakedawkins.com/2020-04-16-unwrap-expect-rust](https://jakedawkins.com/2020-04-16-unwrap-expect-rust/)/

```rust
// `Option` resolves into `Some` or `None`
fn get_status(username: &str) -> Option<&str> {
  // some user lookup code here...
  if(!user_exists) return None;
  // if user exists, fetch their status and return that...
  Some(found_status)
}

// now let's use that function
let result = get_status("takken.io");
match result {
  Some(status) => println!("{}", status),
  None => println!("couldn't find a status for takken.io"),
}
```

```rust
// `Result` resolves into `Ok` or `Err`
fn get_status(username: &str) -> Result<&str, String> {
  // some user lookup code here...
  if(!user_exists) return Err("couldn't find user!".to_string());
  // if user exists, fetch their status and return that...
  Ok(found_status)
}

// now let's use that function
let result = get_status("takken.io");
match result {
  Ok(status) => println!("{}", status),
  Err(e) => println!("{}", e),
}
```

```rust
// Unwrap is a shorthand...
let status = get_status("takken.io").unwrap();

// For `Option`
let status = match get_something("takken.io") {
  Some(s) => s,
  None => panic!()
}

// For `Result`
let status = match get_status("jakedawkins") {
  Ok(s) => s,
  Err(e) => panic!(e),
}
```

### Abstraction

The way of abstraction in rust is really well thought through.

1. Example: abstracting away error handling by implementing `Display`
   https://stackoverflow.com/a/69067523/3593896 (notice the block
   `impl Display for ProcessingError {}`). This honestly blew my mind the first time I saw it and
   realized how powerful abstractions are in Rust.
2. More on error handling:
   [RustConf 2020 - Error handling Isn't All About Errors by Jane Lusby](https://www.youtube.com/watch?v=rAF8mLI0naQ)
3. Abstracting away implementations on structs

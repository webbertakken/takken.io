# Go (Golang)

Useful stuff you should know about Go when moving from another language.

## Resources

- [Spec](https://go.dev/ref/spec)
- [Cheatsheet](https://www.codecademy.com/learn/learn-go/modules/learn-go-introduction/cheatsheet)
- [Learn X in Y minutes](https://learnxinyminutes.com/docs/go/)

## Concepts

These are the concepts I picked up while learning Go myself.

### Loops over iterator abstractions

- Obsesses over loops, and has no iterator abstractions like `.map()` , `.filter()` and `.find()`
  that you see in most languages.

```go
// Variant 1
for i := 1 ; i < len(collection) ; i++ {
  log.Println(collection[i])
}

// Variant 2
for item := range collection {
  log.Println(item)
}
```

<aside>
  💡 Note: Using loops over and over instead of providing iterator abstractions as a language is a conscious design choice by Google. It will most likely not be changed because of Golang’s philosophy. Some people love it, others don’t.

</aside>

### Multiple return values

- Allows for multiple return values and does not have concept of `throw`

```go
// Definition
func getFloat(input string) (float32, error) {
  result, err := strconv.ParseFloat(input, 32)
  if err != nil {
    return 0, err
  }

  return float32(result), nil
}

// Invoke
result, err := getFloat("15")
if err != nil {
  log.Printf("unable to parse %v to float.\n", input)
}

log.Printf("Successfully parsed into %v (float32).\n", result)
```

### Defer

- Has `defer` concept, which allows running something after the function ends.

```go
func save(filePath string, canvas *canvas.Canvas, window fyne.Window) {
  fileHandle, err := os.Create(filePath)

  defer func() {
    err := fileHandle.Close()
    if err != nil {
      dialog.ShowError(err, window)
    }
  }()

  if err != nil {
    dialog.ShowError(err, window)
    return
  }

  err = png.Encode(fileHandle, canvas.PixelData)
  if err != nil {
    dialog.ShowError(err, window)
    return
  }
}
```

### Goroutines

- Has `goroutines` concept, invoked by using `go` keyword. Makes it very easy to work with channels,
  operate on that channel and also return that channel immediately.

```go
func pipeline[I any, O any](inputChannel <-chan I, processFn func(I) O) <-chan O {
  out := make(chan O)

  go func() {
    for input := range inputChannel {
      out <- processFn(input)
    }
    close(out)
  }()

  return out
}
```

- Goroutines have the added benefit that the language will decide between using threads and
  concurrency, without you having to configure anything.

### Type embedding

- Uses type embedding (which is pretty cool!)

```go
// Here Hits embeds the sync.Mutex type
type Hits struct {
  count int
  sync.Mutex
}

// In the `sync` library there are methods that looks like:
func (m *Mutex) Lock() {}
func (m *Mutex) Unlock() {}
```

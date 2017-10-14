# picidae-transformer-file-syntax

## *Support*

We can write something in markdown syntax as blow.

1. Page View Link  
```markdown
[Guide Page](./guide.md)
```

2. File Content Replace  
```markdown
@./relative/path/to/file@
```

3. Disable Control  
````markdown
---
disable-file-syntax: both | file-content | link
---
````


## Option

- prefix: string (default: `'@'`)
- suffix: string (default: `'@'`)
- deep:  boolean： whether enable deep file content replace (default: `true`)
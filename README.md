# tiny-tpl-engine

## Table of Contents

- [Some features](#some-features)
- [Install](#install)
- [Usage](#usage)
- [Tools](#tools)
- [Author](#author)
- [License](#license)

## Some features

At the moment tiny-tpl-engine is capable of:
1. Replacing an element that has some specific tagname with the corresponding template element. Templates are get defined in `Data\templates` directory. For example, imagine you want to have your `<test>` elements treated as templates, in order to accomplish this you have to create `Data\templates\test.tpl` file and here is what it will look like:

```html
<div>
    <span>My first template</span>
    <p>{content}</p>
</div>
```

Then you have to create an XML/HTML file that will be processed by tiny-tpl-engine. Currently there is no option to change name of a directory that contains raw *ML files, the app will take files from `Data\articles_raw` directory. If we create `Data\articles_raw\document.xml` file with this code:

```html
<test>Very important content</test>
```

...it will get processed like this:

```html
<div>
    <span>My first template</span>
    <p>Very important content</p>
</div>
```
...and will get saved in `Data\articles` directory with the same name: `Data\articles\document.xml`.

The engine supports nested templates but unfortunately at the moment it can't handle circular references in templates and will just crash, sorry.

Also, the engine can handle template logic in two ways: individually or by groups. In both cases engine will use `condition` attribute as a condition for existence of an element; you can group elements with `<if>` element. If we have this `Data\templates\test.tpl`:

```html
<div>
    <span condition="this.attr('show') === 'false'">My first template</span>
    <if condition="this.attr('show') === 'true'">
        <span>Visible only if 'show' attribute is 'true'</span>
        <span>This one too</span>
    </if>
    <p>{content}</p>
</div>
```

...and this `Data\articles_raw\document.xml`:

```html
<test>Doesn't have 'show' attribute</test>

<test show="true">Has 'show' attribute</test>
```

...it will get processed like this:
```html
<div>
    <p>Doesn't have 'show' attribute</p>
</div>

<div>
    <span>Visible only if 'show' attribute is 'true'</span>
    <span>This one too</span>
    <p>Has 'show' attribute</p>
</div>
```
The content of `condition` attribute is raw JS, be careful!

2. Modify content, tagname or attributes of element according to its position in a document. It uses CSS-like syntax and logic that is very close to logic of similar features in CSS, `counter-reset` and `counter-increment` for example. Here is the list of CSS properties that will get processed and then removed:
    1. `counter-reset: counter_name[ value(counter_value)][, ...]` - creates a new instance of a counter with the specified name. There may be many counters, they are separated with a comma. `counter_value` is a string with a values separated by spaces; values is a strings, keywords or functions. There are few functions at the moment: 
        1. `attr(attribute_name)` - returns a value of an attribute specified by name,
        2. `counter(counter_name)` - returns a value of a corresponding counter,
    2. `counter-increment: counter_name[ value(counter_value)][, ...]` - increments a corresponding counter instance. If no value is provided then counter is treated like a number and incremented by 1. Otherwise, the value will get assigned to a corresponding counter,
    3. `modify-attribute: attr_name value(attr_value)[, ...]` - modifies an attribute specified by a name. `attr` keyword can be used in `attr_value` to get current value of an attribute,
    4. `modify-content: new_value` - modifies content of an element. `new_value` is a string with a values separated by spaces, the same as `counter_value` and `attr_value`. `content` keyword can be used in `new_value` to get current content of an element,
    5. `modify-tag: new_tagname` - modifies tagname of an element. `new_tagname` is a string with a values separated by spaces, the same as `counter_value` and `attr_value`. `tag` keyword can be used in `new_tagname` to get current tagname of an element,
    6. `remove-attributes: attribute[, ...[, attributeN]]` - removes attributes of an element. `attribute` is a name of attribute.
The properties are listed in order of processing!

All the examples can be found in `Data` folder in this project.

## Install

This little app uses [node](http://nodejs.org) and [npm](https://npmjs.com). Installation process is still in development, sorry. At the moment it can be installed this way: 

```cmd
git clone https://github.com/lucifer63/tiny-tpl-engine
cd tiny-tpl-engine
npm install
```

## Usage

User friendly usage process is still in development too, but at the time tiny-tpl-engine can be used via `run_tpl.bat`

## Tools

Tiny-tpl-engine uses:

* [Cheerio](https://github.com/cheeriojs/cheerio) - Creation of an XML/HTML document with a jQuery interface,
* [Juice](https://github.com/Automattic/juice) - Inlining CSS with respect to order and rules priority.

Many thanks to guys who created these awesome tools!

## Author

**Polevoy Nikita** - [lucifer63](https://github.com/lucifer63)

## License

[MIT](LICENSE) © Polevoy Nikita
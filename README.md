# tiny-tpl-engine

## Table of Contents

- [Some features](#Some features)
- [Install](#install)
- [Usage](#usage)
- [Tools](#tools)
- [Author](#author)
- [License](#license)

## Some features

At the moment tiny-tpl-engine is capable of:
1. Replacing an element that has some specific tagname with the corresponding template element. Templates are get defined in `templates` directory. For example, imagine you want to have your `<test>` elements treated as a template, in order to accomplist this you have to create `templates/test.tpl` file and here is what it will look like:

```html
<div>
	<span>My first template</span>
	<p>{content}</p>
</div>
```

Then you have to create an XML/HTML file that will be processed by the tiny-tpl-engine. Currently there is no option to change name of a directory with raw *ML files, the app will take files from `articles_raw` directory. If we create `articles_raw/document.xml` file with this code:

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
...and will get saved in `articles` directory with the same name: `articles/document.xml`.

The engine supports nested templates but unfortunately at the moment it can't handle circular template and will just crash, sorry.

Also, the engine can handle template logic in two ways: individually or by groups. In both cases engine will use `condition` attribute as a condition for existence of an element; you can group elements with `<if>` element. If we have this `templates/test.tpl`:

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

...and this `articles_raw/document.xml`:

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


## Install

This little app uses [node](http://nodejs.org) and [npm](https://npmjs.com). Installation process is still under development, sorry. At the moment it can be installed this way: 

```cmd
git clone https://github.com/lucifer63/tiny-tpl-engine
cd tiny-tpl-engine
npm install
```

## Usage

User friendly usage process is still under development too, but at the time tiny-tpl-engine can be used via `run_tpl.bat`

## Tools

Tiny-tpl-engine uses:

* [Cheerio](https://github.com/cheeriojs/cheerio) - Creation of an XML/HTML document with a jQuery interface,
* [Juice](https://github.com/Automattic/juice) - Inlining CSS with respect to order and rules priority.

Many thanks to guys who created these awesome tools!

## Author

**Polevoy Nikita** - [lucifer63](https://github.com/lucifer63)

## License

[MIT](LICENSE) © Polevoy Nikita
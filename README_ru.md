# tiny-tpl-engine

*Tiny-tpl-engine* это простой XML шаблонизатор. Особенности: XML синтаксис, логика в шаблонах, асинхронное выполнение пользовательских скриптов, инлайн CSS свойств в атрибуты и кастомные CSS свойства для изменения контента, тега и атрибутов элементов. Управляющие свойства пока что в разработке.

## Table of Contents

- [Возможности](#Возможности)
- [Установка](#Установка)
- [Запуск](#Запуск)
- [Инструменты](#Инструменты)
- [Автор](#Автор)
- [Лицензия](#Лицензия)

## Возможности

1. Собственно, подстановка шаблонов: 

Шаблон:
```html
<!-- templates/test.tpl -->
<div>
    <span>My first template</span>
    <p>{content}</p>
</div>
```
Исходный код:
```html
<!-- raw/document.xml -->
<test>Very important content</test>
```
Конечный код:
```html
<!-- processed/document.xml -->
<div>
    <span>My first template</span>
    <p>Very important content</p>
</div>
```
2. Логика в шаблоне. ``this`` указывает на ~~jQuery~~cheerio-объект текущего элемента, в данном примере - на ``<test>`` и ``<test show="true">``:

Шаблон:
```html
<!-- templates/test.tpl -->
<div>
    <span condition="this.attr('show') === 'false'">My first template</span>
    <if condition="this.attr('show') === 'true'">
        <span>Visible only if 'show' attribute is 'true'</span>
        <span>This one too</span>
    </if>
    <p>{content}</p>
</div>
```
Исходный код:
```html
<!-- raw/document.xml -->
<test>Doesn't have 'show' attribute</test>

<test show="true">Has 'show' attribute</test>
```
Конечный код:
```html
<!-- processed/document.xml -->
<div>
    <p>Doesn't have 'show' attribute</p>
</div>

<div>
    <span>Visible only if 'show' attribute is 'true'</span>
    <span>This one too</span>
    <p>Has 'show' attribute</p>
</div>
```
***Содержимое атрибута `condition` выполняется в глобальном контексте как JS с помощью [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval)!***

3. [CSS-counters](https://habrahabr.ru/post/49500/) и управление исходным кодом элемента с помощью CSS:
    1. `counter-reset: counter_name[ value(counter_value)];` - создаёт экземпляр счётчика с именем `counter_name`. Исходное значение счетчика указывается с помощью `value()`, например счетчик `counter` со значением `"some text"` создаётся так: `counter-reset: counter value("some text");`. Если значение не указано, то по умолчанию счетчик имеет числовой тип и инициализируется со значением *0*. Значение `value()` может содержать строки, ключевые слова и функции. В данный момент поддерживаются всего две функции:
        1. `attr(attribute_name)` - возвращает значение атрибута `attribute_name` текущего элемента,
        2. `counter(counter_name)` - возвращает значение того экземпляра счетчика с именем `counter_name`, который доступен для текущего элемента.
    2. `counter-increment: counter_name[ value(counter_value)];` - устанавливает значение счетчика с именем `counter_name`. Если значение не указано, то счетчик считается числовым и увеличивается на 1,
    3. `modify-attribute: attr_name value(attr_value);` - устанавливает значение атрибута с именем `attr_name` текущего элемента. Ключевое слово `attribute` может быть использовано для доступа к текущему значению атрибута,
    4. `modify-content: new_value;` - устанавливает контент текущего элемента. `new_value` это строка со значениями разделенными пробелом. Ключевое слово `content` может быть использовано для доступа к текущему контенту элемента,
    5. `modify-tag: new_tagname;` - устанавливает имя тега для текущего элемента. `new_tagname` это строка со значениями разделенными пробелом. Ключевое слово `tag` может быть использовано для доступа к текущему имени тега элемента,
    6. `remove-attribute: attribute;` - удаляет атрибут `attribute` текущего элемента.
4. Асинхронное выполнение пользовательских скриптов. Скрипты размещаются в папке `script`, порядок их выполнения объявляется в конфиге. Также скрипты можно привязать к какому-то определенному этапу выполнения, которых всего 5:
    1. init
    2. applyTemplates
    3. inlineStyles
    4. applyCounters
    5. saveFiles
    
    Привязка к этапу осуществляется с помощью комментария в самом начале файла скрипта: ``/* step:applyTemplates */``. Если у скрипта не указан ``step``, то он автоматически привязывается к последнему этапу, ``saveFiles``.
    Скрипты в ``init`` выполняются всего один раз и не привязаны к какому-то конкретному документу.
    Каждый скрипт имеет доступ к текущему документу через переменную `$` (о методах работы с документом можно почитать в [документации к Cheerio](https://github.com/cheeriojs/cheerio#api)) и к имени соответствующего файла через переменную `filename`. О завершении работы скрипт должен сигнализировать выполнением функции `finish_script`, то есть ***по завершении работы скрипта вызов функции `finish_script` обязателен!*** Скрипты выполняются в глобальном контексте, поэтому они имеют доступ вообще ко всему приложению.

## Установка

1. [Git](https://git-scm.com/downloads)
1. [Node.js](https://nodejs.org/en/)
1. [install-tiny-tpl-engine.bat](https://github.com/lucifer63/tiny-tpl-engine/blob/master/install-tiny-tpl-engine.bat) ([raw](https://raw.githubusercontent.com/lucifer63/tiny-tpl-engine/master/install-tiny-tpl-engine.bat))

## Запуск

Запуск *tiny-tpl-engine* пока что производится с помощью [run_tpl.bat](https://github.com/lucifer63/tiny-tpl-engine/blob/master/run_tpl.bat).

## Инструменты

Tiny-tpl-engine использует:

* [Cheerio](https://github.com/cheeriojs/cheerio) - Парсинг XML/HTML, формирование дерева, jQuery-подобный интерфейс,
* [Juice](https://github.com/Automattic/juice) - Инлайн CSS с учетом порядка и приоритета правил,,
* [mkdirp](https://github.com/substack/node-mkdirp) - Создание вложенных директорий.

## Автор

**Полевой Никита** - [lucifer63](https://github.com/lucifer63)

## Лицензия

[MIT](LICENSE) © Полевой Никита
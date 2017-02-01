'use strict';

goog.provide('Blockly.bash');

goog.require('Blockly.Generator');


/**
 * bash code generator.
 * @type {!Blockly.Generator}
 */
Blockly.bash = new Blockly.Generator('bash');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly.bash.addReservedWords(
        // http://php.net/manual/en/reserved.keywords.php
    '__halt_compiler,abstract,and,array,as,break,callable,case,catch,class,' +
    'clone,const,continue,declare,default,die,do,echo,else,elseif,empty,' +
    'enddeclare,endfor,endforeach,endif,endswitch,endwhile,eval,exit,extends,' +
    'final,for,foreach,function,global,goto,if,implements,include,' +
    'include_once,instanceof,insteadof,interface,isset,list,namespace,new,or,' +
    'print,private,protected,public,require,require_once,return,static,' +
    'switch,throw,trait,try,unset,use,var,while,xor,' +
        // http://php.net/manual/en/reserved.constants.php
    'PHP_VERSION,PHP_MAJOR_VERSION,PHP_MINOR_VERSION,PHP_RELEASE_VERSION,' +
    'PHP_VERSION_ID,PHP_EXTRA_VERSION,PHP_ZTS,PHP_DEBUG,PHP_MAXPATHLEN,' +
    'PHP_OS,PHP_SAPI,PHP_EOL,PHP_INT_MAX,PHP_INT_SIZE,DEFAULT_INCLUDE_PATH,' +
    'PEAR_INSTALL_DIR,PEAR_EXTENSION_DIR,PHP_EXTENSION_DIR,PHP_PREFIX,' +
    'PHP_BINDIR,PHP_BINARY,PHP_MANDIR,PHP_LIBDIR,PHP_DATADIR,PHP_SYSCONFDIR,' +
    'PHP_LOCALSTATEDIR,PHP_CONFIG_FILE_PATH,PHP_CONFIG_FILE_SCAN_DIR,' +
    'PHP_SHLIB_SUFFIX,E_ERROR,E_WARNING,E_PARSE,E_NOTICE,E_CORE_ERROR,' +
    'E_CORE_WARNING,E_COMPILE_ERROR,E_COMPILE_WARNING,E_USER_ERROR,' +
    'E_USER_WARNING,E_USER_NOTICE,E_DEPRECATED,E_USER_DEPRECATED,E_ALL,' +
    'E_STRICT,__COMPILER_HALT_OFFSET__,TRUE,FALSE,NULL,__CLASS__,__DIR__,' +
    '__FILE__,__FUNCTION__,__LINE__,__METHOD__,__NAMESPACE__,__TRAIT__'
);

/**
 * Order of operation ENUMs.
 * http://php.net/manual/en/language.operators.precedence.php
 */
Blockly.bash.ORDER_ATOMIC = 0;             // 0 "" ...
Blockly.bash.ORDER_CLONE = 1;              // clone
Blockly.bash.ORDER_NEW = 1;                // new
Blockly.bash.ORDER_MEMBER = 2.1;           // []
Blockly.bash.ORDER_FUNCTION_CALL = 2.2;    // ()
Blockly.bash.ORDER_POWER = 3;              // **
Blockly.bash.ORDER_INCREMENT = 4;          // ++
Blockly.bash.ORDER_DECREMENT = 4;          // --
Blockly.bash.ORDER_BITWISE_NOT = 4;        // ~
Blockly.bash.ORDER_CAST = 4;               // (int) (float) (string) (array) ...
Blockly.bash.ORDER_SUPPRESS_ERROR = 4;     // @
Blockly.bash.ORDER_INSTANCEOF = 5;         // instanceof
Blockly.bash.ORDER_LOGICAL_NOT = 6;        // !
Blockly.bash.ORDER_UNARY_PLUS = 7.1;       // +
Blockly.bash.ORDER_UNARY_NEGATION = 7.2;   // -
Blockly.bash.ORDER_MULTIPLICATION = 8.1;   // *
Blockly.bash.ORDER_DIVISION = 8.2;         // /
Blockly.bash.ORDER_MODULUS = 8.3;          // %
Blockly.bash.ORDER_ADDITION = 9.1;         // +
Blockly.bash.ORDER_SUBTRACTION = 9.2;      // -
Blockly.bash.ORDER_STRING_CONCAT = 9.3;    // .
Blockly.bash.ORDER_BITWISE_SHIFT = 10;     // << >>
Blockly.bash.ORDER_RELATIONAL = 11;        // < <= > >=
Blockly.bash.ORDER_EQUALITY = 12;          // == != === !== <> <=>
Blockly.bash.ORDER_REFERENCE = 13;         // &
Blockly.bash.ORDER_BITWISE_AND = 13;       // &
Blockly.bash.ORDER_BITWISE_XOR = 14;       // ^
Blockly.bash.ORDER_BITWISE_OR = 15;        // |
Blockly.bash.ORDER_LOGICAL_AND = 16;       // &&
Blockly.bash.ORDER_LOGICAL_OR = 17;        // ||
Blockly.bash.ORDER_IF_NULL = 18;           // ??
Blockly.bash.ORDER_CONDITIONAL = 19;       // ?:
Blockly.bash.ORDER_ASSIGNMENT = 20;        // = += -= *= /= %= <<= >>= ...
Blockly.bash.ORDER_LOGICAL_AND_WEAK = 21;  // and
Blockly.bash.ORDER_LOGICAL_XOR = 22;       // xor
Blockly.bash.ORDER_LOGICAL_OR_WEAK = 23;   // or
Blockly.bash.ORDER_COMMA = 24;             // ,
Blockly.bash.ORDER_NONE = 99;              // (...)

/**
 * List of outer-inner pairings that do NOT require parentheses.
 * @type {!Array.<!Array.<number>>}
 */
Blockly.bash.ORDER_OVERRIDES = [
  // (foo()).bar() -> foo().bar()
  // (foo())[0] -> foo()[0]
  [Blockly.bash.ORDER_MEMBER, Blockly.bash.ORDER_FUNCTION_CALL],
  // (foo[0])[1] -> foo[0][1]
  // (foo.bar).baz -> foo.bar.baz
  [Blockly.bash.ORDER_MEMBER, Blockly.bash.ORDER_MEMBER],
  // !(!foo) -> !!foo
  [Blockly.bash.ORDER_LOGICAL_NOT, Blockly.bash.ORDER_LOGICAL_NOT],
  // a * (b * c) -> a * b * c
  [Blockly.bash.ORDER_MULTIPLICATION, Blockly.bash.ORDER_MULTIPLICATION],
  // a + (b + c) -> a + b + c
  [Blockly.bash.ORDER_ADDITION, Blockly.bash.ORDER_ADDITION],
  // a && (b && c) -> a && b && c
  [Blockly.bash.ORDER_LOGICAL_AND, Blockly.bash.ORDER_LOGICAL_AND],
  // a || (b || c) -> a || b || c
  [Blockly.bash.ORDER_LOGICAL_OR, Blockly.bash.ORDER_LOGICAL_OR]
];

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.bash.init = function(workspace) {
  // Create a dictionary of definitions to be printed before the code.
  Blockly.bash.definitions_ = Object.create(null);
  // Create a dictionary mapping desired function names in definitions_
  // to actual function names (to avoid collisions with user functions).
  Blockly.bash.functionNames_ = Object.create(null);

  if (!Blockly.bash.variableDB_) {
    Blockly.bash.variableDB_ =
        new Blockly.Names(Blockly.bash.RESERVED_WORDS_);
  } else {
    Blockly.bash.variableDB_.reset();
  }

};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.bash.finish = function(code) {
  // Convert the definitions dictionary into a list.
  var definitions = [];
  for (var name in Blockly.bash.definitions_) {
    definitions.push(Blockly.bash.definitions_[name]);
  }
  // Clean up temporary data.
  delete Blockly.bash.definitions_;
  delete Blockly.bash.functionNames_;
  Blockly.bash.variableDB_.reset();
  return definitions.join('\n\n') + '\n\n\n' + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.bash.scrubNakedValue = function(line) {
  return line + '\n';
};

/**
 * Encode a string as a properly escaped bash string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} bash string.
 * @private
 */
Blockly.bash.quote_ = function(string) {
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/'/g, '\\\'');
  return '\"' + string + '\"';
};

/**
 * Common tasks for generating bash from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The bash code created for this block.
 * @return {string} bash code with comments and subsequent blocks added.
 * @private
 */
Blockly.bash.scrub_ = function(block, code) {
  var commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    var comment = block.getCommentText();
    comment = Blockly.utils.wrap(comment, Blockly.bash.COMMENT_WRAP - 3);
    if (comment) {
      commentCode += Blockly.bash.prefixLines(comment, '# ') + '\n';
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var i = 0; i < block.inputList.length; i++) {
      if (block.inputList[i].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[i].connection.targetBlock();
        if (childBlock) {
          var comment = Blockly.bash.allNestedComments(childBlock);
          if (comment) {
            commentCode += Blockly.bash.prefixLines(comment, '# ');
          }
        }
      }
    }
  }
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.bash.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

/**
 * Gets a property and adjusts the value while taking into account indexing.
 * @param {!Blockly.Block} block The block.
 * @param {string} atId The property ID of the element to get.
 * @param {number=} opt_delta Value to add.
 * @param {boolean=} opt_negate Whether to negate the value.
 * @param {number=} opt_order The highest order acting on this value.
 * @return {string|number}
 */
Blockly.bash.getAdjusted = function(block, atId, opt_delta, opt_negate,
    opt_order) {
  var delta = opt_delta || 0;
  var order = opt_order || Blockly.bash.ORDER_NONE;
  if (block.workspace.options.oneBasedIndex) {
    delta--;
  }
  var defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
  if (delta > 0) {
    var at = Blockly.bash.valueToCode(block, atId,
            Blockly.bash.ORDER_ADDITION) || defaultAtIndex;
  } else if (delta < 0) {
    var at = Blockly.bash.valueToCode(block, atId,
            Blockly.bash.ORDER_SUBTRACTION) || defaultAtIndex;
  } else if (opt_negate) {
    var at = Blockly.bash.valueToCode(block, atId,
            Blockly.bash.ORDER_UNARY_NEGATION) || defaultAtIndex;
  } else {
    var at = Blockly.bash.valueToCode(block, atId, order) ||
        defaultAtIndex;
  }

  if (Blockly.isNumber(at)) {
    // If the index is a naked number, adjust it right now.
    at = parseFloat(at) + delta;
    if (opt_negate) {
      at = -at;
    }
  } else {
    // If the index is dynamic, adjust it in code.
    if (delta > 0) {
      at = at + ' + ' + delta;
      var innerOrder = Blockly.bash.ORDER_ADDITION;
    } else if (delta < 0) {
      at = at + ' - ' + -delta;
      var innerOrder = Blockly.bash.ORDER_SUBTRACTION;
    }
    if (opt_negate) {
      if (delta) {
        at = '-(' + at + ')';
      } else {
        at = '-' + at;
      }
      var innerOrder = Blockly.bash.ORDER_UNARY_NEGATION;
    }
    innerOrder = Math.floor(innerOrder);
    order = Math.floor(order);
    if (innerOrder && order >= innerOrder) {
      at = '(' + at + ')';
    }
  }
  return at;
};

/**
 * Remove dollar sign ($) from variable.
 * @param {sting} variable name.
 * @return {string}
 */
Blockly.bash.strip$ = function(variable) {
    if (typeof variable != "string") {
        return variable;
    }

    if (-1 < variable.indexOf('${')){
        variable = variable.slice(2,-1);
    }
    return variable;
};


// strips whitespace from strings
function strip_ws(input)
{
	if (typeof input != 'string')
	{
		return "";
	}

	return input.replace(/^\s*/, "").replace(/\s*$/, "");
}

// traverses the string, starting with an open parenthesis, finds the point where it is closed.
function findCloseBalance(input, start)
{
	if (typeof input != 'string')
	{
		return -1;
	}

	if (input[start] != '(')
	{
		return start;
	}

	var i;
	var depth = 1;

	for (i = start + 1; i < input.length; i++)
	{
		if (input[i] == '(') { depth++; }
		else if (input[i] == ')') { depth--; }

		if (depth == 0)
		{
			return i;
		}
	}

	return -1;
}

// Lambda calculus expression "variable" type
function lce_expr_var(input)
{
	this.type = "V";
	this.data = strip_ws(input);
	
	this.toString = function()
	{
		return this.data;
	}
}

// Lambda calculus expression "abstraction" type
function lce_expr_abs()
{
	this.type = "F";
	this.varlist = [];
	this.subexpr = {};

	this.addVar = function(input)
	{
		this.varlist.push(strip_ws(input));
	}
	
	this.toString = function()
	{
		var output = "\\lambda ";
		var i;
		for (i = 0; i < this.varlist.length; i++)
		{
			output += this.varlist[i];
			if (i + 1 < this.varlist.length) { output += " "; }
			else { output += "."; }
		}
		output += this.subexpr.toString();
		
		return output;
	}
}

// Lambda calculus expression "application" type
function lce_expr_app(inlhs, inrhs)
{
	this.type = "A";
	
	this.lhs = inlhs;
	this.rhs = inrhs;

	this.toString = function()
	{
		var output = "";
		if (this.lhs.type == "V") { output += this.lhs.toString(); }
		else { output += "(" + this.lhs.toString() + ")";}
		output += " ";
		if (this.rhs.type == "V") { output += this.rhs.toString(); }
		else { output += "(" + this.rhs.toString() + ")";}
		return output;
	}
}

// class for storing mode/expression pairs in the parser's stack
function stack_pair(inmode, inexpr)
{
	this.mode = inmode;
	this.expr = inexpr;
}

// The main parser method. Takes a string and returns a tree of lce_expr_app, lce_expr_abs, and lce_expr_var objects
function lce_read_expr(input)
{
	if  (typeof input != 'string')
	{
		return undefined;
	}

	var i,j;
	var current = undefined;
	var temp;
	var stack = [];
	var MODE_EXPR = 0; // main mode, determines all type for all other expressions
	var MODE_VARLIST = 1; // handles the function abstraction type, which has a restricted character set(meta-meanings)
	var mode = MODE_EXPR;
	var varstart = 0;
	
	for (i = 0; i < input.length; i++)
	{
		if (mode == MODE_EXPR)
		{
		//recursively handle any parenthesis
			if (input[i] == '(')
			{
				j = findCloseBalance(input, i);
				if (j == -1)
				{
					alert("Error: imbalance of parenthesis.");
					return undefined;
				}
				temp = lce_read_expr(input.substr(i+1, j-i-1));
				if (current == undefined)
				{
					current = temp;
				}
				else
				{
					current = new lce_expr_app(current, temp);
				}
				i = j;
				varstart = i + 1;
			}
			// detect the beginning of a functional abstraction
			else if (input[i] == '\\')
			{
				if (input.substr(i+1,6) == 'lambda')
				{
					i += 7;
					stack.push(new stack_pair(mode, current));
					mode = MODE_VARLIST;
					current = new lce_expr_abs();
					varstart = i;
				}
			}
			// look for variable names and applications
			else if ((input[i].match(/\s/) && strip_ws(input.substr(varstart,i+1-varstart)) != "")
				|| (i + 1 == input.length && strip_ws(input.substr(varstart,i+1-varstart)) != ""))
			{
				if (current == undefined)
				{
					current = new lce_expr_var(input.substr(varstart,i+1-varstart));
				}
				else
				{
					current = new lce_expr_app(current, new lce_expr_var(input.substr(varstart,i+1-varstart)));
				}
				varstart = i;
			}
		}
		else if (mode == MODE_VARLIST)
		{
			//detect the end of the variable list
			if (input[i] == '.')
			{
				if (current.varlist.length == 0)
				{
					alert("Error: lambda without any bound variables.");
					return undefined;
				}
				stack.push(new stack_pair(mode, current));
				mode = MODE_EXPR;
				current = undefined;
				varstart = i + 1;
			}
			// detect illegal characters
			else if (input[i] == '\\' || input[i] == '(' || input[i] == ')')
			{
				alert("Error: Illegal character, '\\', '(', ')' in variable list.");
				return undefined;
			}
			// detect variable names and add to list
			else if ((input[i].match(/\s/) && strip_ws(input.substr(varstart,i+1-varstart)) != "")
				|| ((i + 1 == input.length || input[i + 1] == '.') && strip_ws(input.substr(varstart,i+1-varstart)) != ""))
			{
				current.addVar(input.substr(varstart,i+1-varstart));
				varstart = i;
			}
		}
	}

	// unstack all stored partial results and combine into final result
	while (stack.length > 0)
	{
		if (stack[stack.length - 1].mode == MODE_EXPR)
		{
			if (stack[stack.length - 1].expr != undefined)
			{
				if (current == undefined)
				{
					current = stack[stack.length - 1].expr;
				}
				else
				{
					current = new lce_expr_app(stack[stack.length - 1].expr, current);
				}
			}
		}
		if (stack[stack.length - 1].mode == MODE_VARLIST)
		{
			if (current == undefined)
			{
				alert("Error: abstraction without sub-expression.");
				return undefined;
			}
			stack[stack.length - 1].expr.subexpr = current;
			current = stack[stack.length - 1].expr;
		}
		stack.pop();
	}
	
	return current;
}

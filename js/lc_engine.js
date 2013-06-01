

function def_pair(inname, indef)
{
	this.name = inname;
	this.def = indef;
}

function applyExpr(expr)
{
	var varname = expr.lhs.varlist[0];
	expr.lhs.remVar();
	
	expr.lhs.replace(varname, expr.rhs);
	
	if (expr.lhs.varlist.length == 0)
	{
		return expr.lhs.subexpr;
	}
	else
	{
		return expr.lhs;
	}
}

function lc_engine()
{
	this.def_table_name = "";
	this.out_table_name = "";
	this.orig_expr = undefined;
	this.definitions = [];
	this.steps = [];
	this.steppable = true;

	this.setDefTable = function(input)
	{
		this.def_table_name = input;
	}

	this.setOutTable = function(input)
	{
		this.out_table_name = input;
	}
	
	this.setExpr = function(input)
	{
		this.steps = [];
		this.orig_expr = input;
		this.steps.push(input);
	}
	
	this.addDef = function(name, def)
	{
		if (def == undefined) { alert("Error: failed to parse new definition."); }
		else { this.definitions.push(new def_pair(name, def)); }
	}
	
	this.makeTables = function()
	{
		var i;
		var defout = "<table>\n\t<tr><th>Name</th><th>Value</th></tr>\n";
		var stepout = "<table>\n\t<tr><th>Step Number</th><th>Expression</th></tr>\n";

		for (i = 0; i < this.definitions.length; i++)
		{
			defout += "\t<tr><td>" + this.definitions[i].name + "</td><td>" + this.definitions[i].def.toString() + "</td></tr>\n";
		}

		defout += "</table>\n";


		for (i = 0; i < this.steps.length; i++)
		{
			stepout += "\t<tr><td>" + i + "</td><td>" + this.steps[i].toString() + "</td></tr>\n";
		}

		stepout += "</table>\n";

		document.getElementById(this.def_table_name).innerHTML = defout;
		document.getElementById(this.out_table_name).innerHTML = stepout;
	}
	
	this.step = function()
	{
		if (!this.steppable) { return; }
		if (this.steps.length == 0) { return; }

		var current = this.steps[this.steps.length - 1].copy();

		if (current.type == "A")
		{
			if (current.lhs.type == "F")
			{
				current = applyExpr(current);
				this.steps.push(current);
				this.makeTables();
			}
		}
	}
}
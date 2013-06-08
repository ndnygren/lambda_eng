
/*
    lc_engine - Lambda Calculus parser and interpreter
    Copyright (C) 2013 Nick Nygren

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
		this.steppable = true
		this.steps = [];
		this.orig_expr = input;
		this.steps.push(input);
		this.step();
	}
	
	this.addDef = function(name, def)
	{
		var i;
		if (def == undefined) { alert("Error: failed to parse new definition."); }
		else
		{
			for (i = 0; i < this.definitions.length && name > this.definitions[i].name; i++) { }
			if (i == this.definitions.length)
			{
				this.definitions.push(new def_pair(name, def));
			}
			else if (name == this.definitions[i].name)
			{
				this.definitions[i] = new def_pair(name, def);
			}
			else
			{
				this.definitions.splice(i,0, new def_pair(name, def));
			}
		}
	}
	
	this.makeTables = function()
	{
		var i;
		var defout = "<table class=\"lce_output_table\">\n\t<tr><th>Name</th><th>Value</th></tr>\n";
		var stepout = "<table class=\"lce_output_table\">\n\t<tr><th>Step Number</th><th>Expression</th></tr>\n";

		for (i = 0; i < this.definitions.length; i++)
		{
			defout += "\t<tr><td>" + this.definitions[i].name + "</td><td>" + this.definitions[i].def.toString().replace(/\\lambda/g, "&lambda;") + "</td></tr>\n";
		}

		defout += "</table>\n";


		for (i = 0; i < this.steps.length; i++)
		{
			stepout += "\t<tr><td>" + i + "</td><td>" + this.steps[i].toString().replace(/\\lambda/g, "&lambda;") + "</td></tr>\n";
		}

		stepout += "</table>\n";

		document.getElementById(this.def_table_name).innerHTML = defout;
		document.getElementById(this.out_table_name).innerHTML = stepout;
	}

	this.inDefs = function(key)
	{
		var i;
		for (i = 0; i < this.definitions.length; i++)
		{
			if (this.definitions[i].name == key)
			{
				return i;
			}
		}
		return -1;
	}
	
	this.findNextStep = function(expr)
	{
		var temp;
		if (expr.type == "F")
		{
			temp = this.findNextStep(expr.subexpr);
			if (temp != undefined)
			{
				expr.subexpr = temp;
				return expr;
			}
		}
		if (expr.type == "A")
		{
			if (expr.lhs.type == "F")
			{
				return applyExpr(expr);
			}
			else
			{
				temp = this.findNextStep(expr.lhs);
				if (temp != undefined)
				{
					expr.lhs = temp;
					return expr;
				}

				temp = this.findNextStep(expr.rhs);
				if (temp != undefined)
				{
					expr.rhs = temp;
					return expr;
				}
			}
		}

		return undefined;
	}

	this.findFirstName = function(expr)
	{
		if (expr.type == "F")
		{
			if (expr.subexpr.type == "V" && this.inDefs(expr.subexpr.data) != -1)
			{
				expr.subexpr = this.definitions[this.inDefs(expr.subexpr.data)].def.copy();
				return expr;
			}

			temp = this.findFirstName(expr.subexpr);
			if (temp != undefined)
			{
				expr.subexpr = temp;
				return expr;
			}
		}
		if (expr.type == "A")
		{
			temp = this.findFirstName(expr.lhs);
			if (temp != undefined)
			{
				expr.lhs = temp;
				return expr;
			}
			else if (expr.lhs.type == "V" && this.inDefs(expr.lhs.data) != -1)
			{
				expr.lhs = this.definitions[this.inDefs(expr.lhs.data)].def.copy();
				return expr;
			}

			temp = this.findFirstName(expr.rhs);
			if (temp != undefined)
			{
				expr.rhs = temp;
				return expr;
			}
			else if (expr.rhs.type == "V" && this.inDefs(expr.rhs.data) != -1)
			{
				expr.rhs = this.definitions[this.inDefs(expr.rhs.data)].def.copy();
				return expr;
			}
		}

		return undefined;
	}
	
	this.step = function()
	{
		if (!this.steppable) { return; }
		if (this.steps.length == 0) { return; }

		var current = this.steps[this.steps.length - 1].copy();

		current = this.findNextStep(current);

		if (current)
		{
			this.steps.push(current);
			this.makeTables();
		}
		else
		{
			current = this.steps[this.steps.length - 1].copy();
			current = this.findFirstName(current);
			if (current)
			{
				this.steps.push(current);
				this.makeTables();
			}
			else
			{
				this.steppable = false;
			}
		}

		if (this.steppable)
		{
			eng = this;
			setTimeout(function()
			{
				eng.step();
			}, 10);
		}
	}
}
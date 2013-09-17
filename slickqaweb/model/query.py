__author__ = 'jcorbett'


import pyparsing

comparison_method_name = pyparsing.oneOf(['eq','ne','lt','lte','gt','gte','in','nin','all','size','exists'])
string_comparison_method_name = pyparsing.oneOf(['exact','iexact','contains','icontains','startswith','istartswith','endswith','iendswith'])
logical_method_name = pyparsing.oneOf(['and','or','not'])

quoted_string = pyparsing.dblQuotedString.copy().parseAction(pyparsing.removeQuotes)

identifier = pyparsing.Word(pyparsing.alphas, pyparsing.alphanums + '_')
complex_identifier = identifier + pyparsing.ZeroOrMore(pyparsing.Literal('.') + identifier)

open_paren = pyparsing.Suppress('(')
close_paren = pyparsing.Suppress(')')

integer_value = pyparsing.Word(pyparsing.nums)
float_value = pyparsing.Regex(r'\d+\.\d+')
simple_value = (quoted_string | float_value | integer_value)

list_value = open_paren + simple_value + pyparsing.ZeroOrMore(pyparsing.Suppress(',') + simple_value) + close_paren

method_value = simple_value | list_value

string_comparison = pyparsing.Group(string_comparison_method_name + open_paren + complex_identifier + pyparsing.OneOrMore(pyparsing.Suppress(',') + quoted_string) + close_paren)
simple_comparison = pyparsing.Group(comparison_method_name + open_paren + complex_identifier + pyparsing.OneOrMore(pyparsing.Suppress(',') + method_value) + close_paren)

logical_operation = pyparsing.Forward()
operation = (simple_comparison | string_comparison | logical_operation)
logical_operation << (logical_method_name + open_paren + operation + pyparsing.ZeroOrMore(pyparsing.Suppress(',') + operation) + close_paren)

query = operation

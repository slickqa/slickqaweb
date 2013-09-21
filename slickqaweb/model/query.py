__author__ = 'jcorbett'


#################################################################################
# I know this file is a mess, it's an example of experiment driven coding.
# over time I will start putting in unit tests and cleaning this up and making
# it more orderly
#################################################################################


import pyparsing

from mongoengine import Q
from flask import request

comparison_method_name = pyparsing.oneOf(['eq','ne','lt','lte','gt','gte', 'size', 'exists'])
list_comparison_method_name = pyparsing.oneOf(['in', 'nin', 'all'])
string_comparison_method_name = pyparsing.oneOf(['exact','iexact','contains','icontains','startswith','istartswith','endswith','iendswith'])
open_paren = pyparsing.Suppress('(')
close_paren = pyparsing.Suppress(')')


quoted_string = pyparsing.dblQuotedString.copy().addParseAction(pyparsing.removeQuotes)

def process_escapes(s,l,t):
    s = t[0]
    s = s.replace('\\"','"')
    s = s.replace('\\r', "\r")
    s = s.replace('\\n', "\n")
    return s

quoted_string.addParseAction(process_escapes)

def replace_period_with_double_underscore(s,l,t):
    return '__'

def join(s,l,t):
    return ''.join(t)

identifier = pyparsing.Word(pyparsing.alphas, pyparsing.alphanums + '_')
complex_identifier = identifier + pyparsing.ZeroOrMore(pyparsing.Literal('.').setParseAction(replace_period_with_double_underscore) + identifier)

complex_identifier.setParseAction(join)

def parseInteger(s,l,t):
    return int(t[0])

integer_value = pyparsing.Word(pyparsing.nums).addParseAction(parseInteger)

def parseFloat(s,l,t):
    return float(t[0])

float_value = pyparsing.Regex(r'\d+\.\d+').addParseAction(parseFloat)

def parseBoolean(s,l,t):
    return bool(t[0])

boolean_value = pyparsing.oneOf(['True', 'False', 'true', 'false']).addParseAction(parseBoolean)


simple_value = (quoted_string | float_value | integer_value | boolean_value)

list_value = open_paren + simple_value + pyparsing.ZeroOrMore(pyparsing.Suppress(',') + simple_value) + close_paren

def simpleQuery(s,l,t):
    if t[0][0] == 'eq':
        return Q(**{t[0][1]: t[0][2]})
    else:
        return Q(**{t[0][1] + '__' + t[0][0] : t[0][2]})

string_comparison = pyparsing.Group(string_comparison_method_name + open_paren + complex_identifier + pyparsing.Suppress(',') + quoted_string + close_paren).setParseAction(simpleQuery)
simple_comparison = pyparsing.Group(comparison_method_name + open_paren + complex_identifier + pyparsing.Suppress(',') + simple_value + close_paren).setParseAction(simpleQuery)
list_comparison = pyparsing.Group(list_comparison_method_name + open_paren + complex_identifier + pyparsing.Suppress(',') + list_value + close_paren).setParseAction(simpleQuery)
logical_operation = pyparsing.Forward()
operation = (simple_comparison | string_comparison | list_comparison | logical_operation)

def notQuery(s,l,t):
    query_dict = {}
    for key,value in t[1].query.iteritems():
        key_parts = key.split('__')
        new_key = ""
        if key_parts[len(key_parts) - 1] == 'eq':
            new_key = '__'.join(key_parts[:len(key_parts) -1] + ['ne',])
        else:
            new_key = '__'.join(key_parts[:len(key_parts) - 1] + ['not', key_parts[len(key_parts) -1]])
        query_dict[new_key] = value
    return Q(**query_dict)

not_operation = pyparsing.Literal('not') + open_paren + (string_comparison | simple_comparison | list_comparison) + close_paren
not_operation.setParseAction(notQuery)

def andQuery(s,l,t):
    orig = t[1]
    for anded in t[2:]:
        orig = orig & anded
    return orig

and_operation = pyparsing.Literal('and') + open_paren + operation + pyparsing.OneOrMore(pyparsing.Suppress(',') + operation) + close_paren
and_operation.setParseAction(andQuery)

def orQuery(s,l,t):
    orig = t[1]
    for ored in t[2:]:
        orig = orig | ored
    return orig

or_operation = pyparsing.Literal('or') + open_paren + operation + pyparsing.OneOrMore(pyparsing.Suppress(',') + operation) + close_paren
or_operation.setParseAction(orQuery)

logical_operation << (and_operation | or_operation | not_operation)

query = operation

def getMongoengineQueryFromString(query_string):
    return query.parseString(query_string)[0]

def buildQueryFromRequest():
    if request.args.has_key('q'):
        return getMongoengineQueryFromString(request.args.get('q'))
    else:
        query = None
        for key,value in request.args.iteritems():
            param = key.replace('.', '__')
            if query is not None:
                query = query & Q(**{param: value})
            else:
                query = Q(**{param: value})
        return query


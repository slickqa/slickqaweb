__author__ = 'jcorbett'

import unittest

class Dummy(unittest.TestCase):
    def nop(self):
        pass
_t = Dummy('nop')


# doing it this way (instead of dynamically like nose.tools does) gives us code completion
assert_false = _t.assertFalse
assert_true = _t.assertTrue
assert_raises = _t.assertRaises
assert_equal = _t.assertEqual
assert_not_equal = _t.assertNotEqual
assert_almost_equal = _t.assertAlmostEqual
assert_not_almost_equal = _t.assertNotAlmostEqual
assert_sequence_equal = _t.assertSequenceEqual
assert_list_equal = _t.assertListEqual
assert_tuple_equal = _t.assertTupleEqual
assert_set_equal = _t.assertSetEqual
assert_in = _t.assertIn
assert_not_in = _t.assertNotIn
assert_is = _t.assertIs
assert_is_not = _t.assertIsNot
assert_dict_equal = _t.assertDictEqual
assert_dict_contains_subset = _t.assertDictContainsSubset
assert_items_equal = _t.assertItemsEqual
assert_multi_line_equal = _t.assertMultiLineEqual
assert_less = _t.assertLess
assert_less_equal = _t.assertLessEqual
assert_greater = _t.assertGreater
assert_greater_equal = _t.assertGreaterEqual
assert_is_none = _t.assertIsNone
assert_is_not_none = _t.assertIsNotNone
assert_is_instance = _t.assertIsInstance
assert_not_is_instance = _t.assertNotIsInstance
assert_raises_regexp = _t.assertRaisesRegexp
assert_regexp_matches = _t.assertRegexpMatches
assert_not_regexp_matches = _t.assertNotRegexpMatches

del _t
del Dummy

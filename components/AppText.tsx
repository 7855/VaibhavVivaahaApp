import React from 'react';
import { Text, TextProps } from 'react-native';

type Weight = 'regular' | 'medium' | 'bold';

const WEIGHT_TO_FONT: Record<Weight, string> = {
  regular: 'Rubik-Regular',
  medium: 'Rubik-Medium',
  bold: 'Rubik-Bold',
};

interface AppTextProps extends TextProps {
  weight?: Weight;
}

// Sets fontFamily via `style`, never the bare `fontFamily`/`fontWeight` prop — NativeBase's
// prop-form silently loses the custom font on Android when paired with fontWeight (see
// CLAUDE.md section 17). Plain RN <Text style={{fontFamily:...}}> doesn't hit that bug.
export default function AppText({ weight = 'regular', style, children, ...rest }: AppTextProps) {
  return (
    <Text style={[{ fontFamily: WEIGHT_TO_FONT[weight] }, style]} {...rest}>
      {children}
    </Text>
  );
}

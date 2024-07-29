import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/system';

const ExpandableBoxContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  overflow: 'hidden',
  transition: 'width 0.3s ease-in-out',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  //   justifySelf: 'stretch',
  //   alignSelf: 'stretch',
}));

interface ExpandableBoxProps {
  initialWidth: string;
  expandedWidth: string;
  children: React.ReactNode;
}

const ExpandableBox: React.FC<ExpandableBoxProps> = ({
  initialWidth,
  expandedWidth,
  children,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  return (
    <ExpandableBoxContainer
      sx={{
        width: expanded ? expandedWidth : initialWidth,
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 2, minWidth: initialWidth }}>
        {children}
        <Button
          onClick={handleToggle}
          sx={{ position: 'absolute', top: 10, right: 10, zIndex: 3 }}
        >
          {expanded ? 'Retract' : 'Expand'}
        </Button>
      </Box>
    </ExpandableBoxContainer>
  );
};

export default ExpandableBox;

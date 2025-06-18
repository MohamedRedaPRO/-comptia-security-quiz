import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Toolbar,
  Divider,
  Tooltip,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Add your notes here...",
  minHeight = 150
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
      }
    }
  };

  return (
    <Paper variant="outlined" sx={{ border: isFocused ? 2 : 1, borderColor: isFocused ? 'primary.main' : 'divider' }}>
      <Toolbar variant="dense" sx={{ minHeight: 48, px: 1 }}>
        <Tooltip title="Bold (Ctrl+B)">
          <IconButton
            size="small"
            onClick={() => executeCommand('bold')}
            color={isCommandActive('bold') ? 'primary' : 'default'}
          >
            <FormatBoldIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Italic (Ctrl+I)">
          <IconButton
            size="small"
            onClick={() => executeCommand('italic')}
            color={isCommandActive('italic') ? 'primary' : 'default'}
          >
            <FormatItalicIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Underline (Ctrl+U)">
          <IconButton
            size="small"
            onClick={() => executeCommand('underline')}
            color={isCommandActive('underline') ? 'primary' : 'default'}
          >
            <FormatUnderlinedIcon />
          </IconButton>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        <Tooltip title="Bullet List">
          <IconButton
            size="small"
            onClick={() => executeCommand('insertUnorderedList')}
            color={isCommandActive('insertUnorderedList') ? 'primary' : 'default'}
          >
            <FormatListBulletedIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Numbered List">
          <IconButton
            size="small"
            onClick={() => executeCommand('insertOrderedList')}
            color={isCommandActive('insertOrderedList') ? 'primary' : 'default'}
          >
            <FormatListNumberedIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
      
      <Divider />
      
      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        sx={{
          minHeight,
          p: 2,
          outline: 'none',
          '&:empty::before': {
            content: `"${placeholder}"`,
            color: 'text.secondary',
            fontStyle: 'italic'
          },
          '& p': {
            margin: '0 0 8px 0',
            '&:last-child': {
              marginBottom: 0
            }
          },
          '& ul, & ol': {
            margin: '8px 0',
            paddingLeft: '24px'
          },
          '& li': {
            marginBottom: '4px'
          }
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </Paper>
  );
};

export default RichTextEditor; 
import React, { useState, useEffect, useRef } from "react";
import {
  Popover,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Box,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import YouTubeIcon from '@mui/icons-material/YouTube';
import RedditIcon from '@mui/icons-material/Reddit';

interface SmartSearchProps {
  children: React.ReactNode;
  questionDomain?: string;
}

interface SearchSuggestion {
  label: string;
  query: string;
  icon: React.ReactNode;
  site?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

const SmartSearch: React.FC<SmartSearchProps> = ({ children, questionDomain }) => {
  const [selectedText, setSelectedText] = useState('');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const generateSearchSuggestions = (text: string, domain?: string): SearchSuggestion[] => {
    const cleanText = text.trim().toLowerCase();
    if (cleanText.length < 3) return [];
    const suggestions: SearchSuggestion[] = [];
    suggestions.push({
      label: `What is "${text}" in Security+?`,
      query: `"${text}" CompTIA Security+ definition`,
      icon: <SecurityIcon />, color: 'primary'
    });
    suggestions.push({
      label: `"${text}" explained`,
      query: `"${text}" cybersecurity explained`,
      icon: <SchoolIcon />, color: 'info'
    });
    if (domain) {
      suggestions.push({
        label: `"${text}" in ${domain}`,
        query: `"${text}" "${domain}" CompTIA Security+`,
        icon: <BookIcon />, color: 'secondary'
      });
    }
    if (isNetworkingTerm(cleanText)) {
      suggestions.push({
        label: `${text} networking concept`,
        query: `"${text}" networking security protocol`,
        icon: <SecurityIcon />, color: 'warning'
      });
    }
    if (isCryptographyTerm(cleanText)) {
      suggestions.push({
        label: `${text} cryptography`,
        query: `"${text}" encryption cryptography algorithm`,
        icon: <SecurityIcon />, color: 'success'
      });
    }
    if (isAttackTerm(cleanText)) {
      suggestions.push({
        label: `${text} attack method`,
        query: `"${text}" cyber attack method prevention`,
        icon: <SecurityIcon />, color: 'error'
      });
    }
    suggestions.push({
      label: `${text} tutorial videos`,
      query: `"${text}" CompTIA Security+ tutorial`,
      icon: <YouTubeIcon />, site: 'youtube.com', color: 'error'
    });
    suggestions.push({
      label: `${text} discussions`,
      query: `"${text}" site:reddit.com/r/CompTIA OR site:reddit.com/r/cybersecurity`,
      icon: <RedditIcon />, color: 'warning'
    });
    suggestions.push({
      label: `${text} practice questions`,
      query: `"${text}" CompTIA Security+ practice questions exam`,
      icon: <SchoolIcon />, color: 'info'
    });
    return suggestions;
  };

  const isNetworkingTerm = (text: string): boolean => {
    const networkingTerms = [
      'vpn', 'firewall', 'router', 'switch', 'vlan', 'nat', 'dhcp', 'dns', 'tcp', 'udp', 'ip',
      'subnet', 'gateway', 'proxy', 'load balancer', 'ids', 'ips', 'waf', 'dmz', 'network segmentation'
    ];
    return networkingTerms.some(term => text.includes(term));
  };
  const isCryptographyTerm = (text: string): boolean => {
    const cryptoTerms = [
      'aes', 'rsa', 'sha', 'md5', 'hash', 'encryption', 'decryption', 'cipher', 'key', 'certificate',
      'pki', 'ssl', 'tls', 'digital signature', 'hmac', 'symmetric', 'asymmetric', 'public key', 'private key'
    ];
    return cryptoTerms.some(term => text.includes(term));
  };
  const isAttackTerm = (text: string): boolean => {
    const attackTerms = [
      'phishing', 'malware', 'ransomware', 'ddos', 'sql injection', 'xss', 'csrf', 'mitm', 'brute force',
      'social engineering', 'trojan', 'virus', 'worm', 'rootkit', 'backdoor', 'privilege escalation'
    ];
    return attackTerms.some(term => text.includes(term));
  };

  // --- Text selection and popover logic ---
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const selectedText = selection.toString().trim();
    if (selectedText.length < 3) {
      handleClosePopover();
      return;
    }
    const range = selection.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      return;
    }
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setSelectedText(selectedText);
    setPopoverPosition({
      top: rect.bottom - containerRect.top + 5,
      left: rect.left - containerRect.left
    });
    setAnchorEl(container);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setSelectedText('');
  };

  const handleSearchClick = (suggestion: SearchSuggestion) => {
    let searchUrl = '';
    if (suggestion.site === 'youtube.com') {
      searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(suggestion.query)}`;
    } else if (suggestion.query.includes('site:reddit.com')) {
      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(suggestion.query)}`;
    } else {
      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(suggestion.query)}`;
    }
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
    handleClosePopover();
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('keyup', handleTextSelection);
    document.addEventListener('click', (e) => {
      if (anchorEl && !anchorEl.contains(e.target as Node)) {
        handleClosePopover();
      }
    });
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('keyup', handleTextSelection);
    };
  }, [anchorEl]);

  const suggestions = generateSearchSuggestions(selectedText, questionDomain);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {children}
      <Popover
        open={Boolean(anchorEl && selectedText)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorReference="anchorPosition"
        anchorPosition={{
          top: popoverPosition.top,
          left: popoverPosition.left
        }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { maxWidth: 400, maxHeight: 500, overflow: 'auto' } }}
      >
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SearchIcon color="primary" />
            <Typography variant="subtitle2" color="primary">Smart Search</Typography>
            <Chip label={`"${selectedText.length > 20 ? selectedText.substring(0, 20) + '...' : selectedText}"`} size="small" variant="outlined" />
          </Box>
          <Divider sx={{ mb: 1 }} />
          <List dense>
            {suggestions.map((suggestion, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton onClick={() => handleSearchClick(suggestion)} sx={{ borderRadius: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {React.cloneElement(suggestion.icon as React.ReactElement, {
                      color: suggestion.color || 'primary', fontSize: 'small'
                    })}
                  </ListItemIcon>
                  <ListItemText primary={suggestion.label} primaryTypographyProps={{ variant: 'body2', sx: { fontSize: '0.875rem' } }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            💡 Select any text to get smart search suggestions
          </Typography>
        </Paper>
      </Popover>
    </div>
  );
};

export default SmartSearch;

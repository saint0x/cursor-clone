# TODO List

## 1. Change Base Directory Away from Desktop/cursor-clone
- [ ] Add workspace configuration system
  - [ ] Create `.workspace` config file format
  - [ ] Add workspace path selection on startup
  - [ ] Store recent workspaces list
- [ ] Update filesystem API
  - [ ] Make base path configurable
  - [ ] Add workspace validation
  - [ ] Handle multi-workspace support
- [ ] Add workspace switching in UI
  - [ ] Workspace picker in top bar
  - [ ] Quick workspace switcher (Cmd/Ctrl + P)

## 2. Give AI Access to File Editing API Stream
- [ ] Enhance AI communication protocol
  - [ ] Add streaming response support
  - [ ] Implement file operation streaming
  - [ ] Add progress indicators for operations
- [ ] Create file operation streaming API
  - [ ] Real-time operation status updates
  - [ ] Operation preview capability
  - [ ] Rollback mechanism for failed operations
- [ ] Add AI feedback system
  - [ ] Live operation feedback
  - [ ] Error correction suggestions
  - [ ] Operation confirmation UI

## 3. Implement Live Terminal
- [ ] Create WebSocket-based terminal
  - [ ] PTY integration
  - [ ] Shell session management
  - [ ] Command history
- [ ] Add terminal features
  - [ ] Tab completion
  - [ ] Multi-terminal support
  - [ ] Split terminal views
- [ ] Terminal integration
  - [ ] Link terminal with file system
  - [ ] Add terminal to AI context
  - [ ] Command suggestion system

## 4. Add Drag Resizing to Panels
- [ ] Implement resizable panels
  - [ ] Add resize handles
  - [ ] Save panel sizes in layout
  - [ ] Min/max size constraints
- [ ] Panel features
  - [ ] Panel collapse/expand
  - [ ] Panel rearrangement
  - [ ] Layout presets
- [ ] Layout persistence
  - [ ] Save layout to config
  - [ ] Layout quick switch
  - [ ] Custom layout templates

## Implementation Notes
- Base directory change requires careful handling of file paths and permissions
- File editing stream needs robust error handling and progress tracking
- Terminal implementation should use node-pty for proper shell integration
- Panel resizing should maintain smooth performance with live updates

## Future Considerations
- Multi-window support
- Remote workspace connections
- Custom panel types
- Layout sharing between instances 
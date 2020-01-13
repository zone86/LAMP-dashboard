
// Core Imports 
import React, { useState } from 'react'
import { 
    Box, Button, AppBar, Toolbar, Tooltip, MenuItem, Badge, 
    IconButton, Snackbar, Menu, Icon, Dialog, DialogTitle, 
    DialogContent, DialogContentText, DialogActions 
} from '@material-ui/core'
import { red } from '@material-ui/core/colors'

// Local Imports 
import CredentialManager from './CredentialManager'
import { ResponsiveMargin } from './Utils'

export default function NavigationLayout({ title, id, noToolbar, goBack, onLogout, ...props }) {
    const [state, setState] = useState({})
    const [showCustomizeMenu, setShowCustomizeMenu] = useState()
    const [confirmLogout, setConfirmLogout] = useState()
    const [passwordChange, setPasswordChange] = useState()
    return (
        <div>
    		{!!noToolbar ? <React.Fragment/> :
    			<AppBar position="static" style={{background: 'transparent', boxShadow: 'none'}}>
    				<Toolbar>
    					<IconButton
    						onClick={goBack} 
    						color="default"
    						aria-label="Menu"
                        >
    						<Icon>arrow_back</Icon>
    					</IconButton>
                        <Box flexGrow={1} />
    					<div>
                            <Tooltip title="Notifications">
        						<IconButton color="default" onClick={() => {}}>
        							<Badge badgeContent={0} color="secondary">
        								<Icon>notifications</Icon>
        							</Badge>
        						</IconButton>
                            </Tooltip>
                            <Tooltip title="Profile & Settings">
        						<IconButton
        							aria-owns={!!showCustomizeMenu ? 'menu-appbar' : null}
        							aria-haspopup="true"
        							onClick={event => setShowCustomizeMenu(event.currentTarget)}
        							color="default"
                                >
        							<Icon>account_circle</Icon>
        						</IconButton>
                            </Tooltip>
    						<Menu
    							id="menu-appbar"
    							anchorEl={showCustomizeMenu}
    							anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
    							transformOrigin={{horizontal: 'right', vertical: 'top'}}
    							open={!!showCustomizeMenu && !confirmLogout && !passwordChange}
    							onClose={() => setShowCustomizeMenu()}
                            >
                                <MenuItem disabled divider><b>{title}</b></MenuItem>
    							{!!id && <MenuItem onClick={() => setPasswordChange(true)}>Manage Credentials</MenuItem>}
    							<MenuItem onClick={() => setConfirmLogout(true)}>Logout</MenuItem>
    						</Menu>
    					</div>
    				</Toolbar>
    			</AppBar>
    		}
            <div style={{ marginTop: 0, paddingBottom: 56, width: '100%', overflowY: 'auto' }}>
                <ResponsiveMargin style={{ width: '80%', marginTop: 20, marginLeft: 'auto', marginRight: 'auto' }}>
                    {React.Children.map(props.children, child =>
                        React.cloneElement(child, { layout: {
                            showMessage: (message, timeout = 3000) => {
                                setState(state => ({ ...state, snackMessage: message }))
                                setTimeout(() => setState(state => ({ ...state, snackMessage: null })), timeout)
                            },
                            showAlert: (message) => setState(state => ({ ...state, alertMessage: message }))
                        }})
                    )}
                </ResponsiveMargin>
            </div>
            <Dialog
                open={!!confirmLogout}
                onClose={() => setConfirmLogout()}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    Are you sure you want to log out of LAMP right now?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        If you've made some changes, make sure they're saved before you continue to log out.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmLogout()} color="secondary">
                        Go Back
                    </Button>
                    <Button onClick={onLogout} color="primary" autoFocus>
                        Logout
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={!!state.alertMessage}
                onClose={() => setState(state => ({ ...state, alertMessage: undefined }))}
                aria-labelledby="alert-dialog-slide-title"
                aria-describedby="alert-dialog-slide-description"
                PaperProps={{style: { backgroundColor: red[900] }}}
            >
                <DialogTitle id="alert-dialog-slide-title">
                    <span style={{color: 'white'}}>That action could not be completed. Please try again later. (Error code: -16003.)</span>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        <span style={{color: 'white'}}>{state.alertMessage}</span>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setState(state => ({ ...state, alertMessage: undefined }))} color="primary">
                      <span style={{color: 'white'}}>OK</span>
                  </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={!!passwordChange && !!id}
                onClose={() => setPasswordChange()}
            >
                <DialogContent style={{ marginBottom: 12 }}>
                    <CredentialManager 
                        id={id} 
                        onError={err => setState(state => ({ ...state, alertMessage: err }))}
                    />
                </DialogContent>
            </Dialog>
    		<Snackbar
    			open={!!state.snackMessage}
    			message={state.snackMessage || ''}
    			anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    			autoHideDuration={3000}
    			onClose={() => setState(state => ({ ...state, userMsg: null }))} />
        </div>
    )
}
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Settings, LogOut, Menu, X, Camera, Shield, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdmin } = useUserRole();
  
  // Safely use auth context with error handling
  let user = null;
  let profile = null;
  let signOut = () => {};
  
  try {
    const authContext = useAuth();
    user = authContext.user;
    profile = authContext.profile;
    signOut = authContext.signOut;
  } catch (error) {
    console.warn('AuthContext not available in Navbar:', error);
  }

  const handleSignOut = async () => {
    try {
      console.log('Navbar: Starting sign out process...');
      await signOut();
      console.log('Navbar: Sign out completed, navigating to home...');
      navigate('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Navbar: Error during sign out:', error);
      // Navigate anyway to prevent user being stuck
      navigate('/');
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { to: "/examples", label: "Galerie", icon: Camera },
    { to: "/contact", label: "Contact", icon: User },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border shadow-elegant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-3 group"
            >
              <div className="w-8 h-8 bg-gradient-button rounded-lg flex items-center justify-center shadow-md">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200">
                CrazyPixels
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 font-medium"
                >
                  <link.icon className="h-4 w-4 mr-2" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              {/* Admin Link */}
              {user && isAdmin && (
                <Link 
                  to="/admin"
                  className="hidden sm:flex items-center px-3 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:scale-105 transition-all duration-200 shadow-md font-medium text-sm"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-brand-primary/30 transition-all duration-200">
                      <Avatar className="h-10 w-10 border-2 border-brand-primary/20 hover:border-brand-primary/40 transition-colors">
                        <AvatarFallback className="bg-gradient-button text-white font-semibold text-sm">
                          {(profile?.contact_name || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.contact_name || 'Utilisateur'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        {isAdmin && (
                          <div className="flex items-center mt-1">
                            <Shield className="h-3 w-3 mr-1 text-violet-500" />
                            <span className="text-xs text-violet-500 font-medium">Administrateur</span>
                          </div>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mon compte
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer text-violet-600">
                          <Shield className="mr-2 h-4 w-4" />
                          Administration
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link 
                  to="/auth?tab=signin"
                  className="px-6 py-2 bg-gradient-button text-white rounded-lg hover:scale-105 transition-all duration-200 shadow-glow font-semibold text-sm"
                >
                  Se connecter
                </Link>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-lg">
          <div className="flex flex-col h-full pt-16">
            <div className="flex-1 px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors font-medium text-lg"
                >
                  <link.icon className="h-5 w-5 mr-3" />
                  {link.label}
                </Link>
              ))}
              
              {user && (
                <>
                  <div className="border-t border-border my-4"></div>
                  <Link
                    to="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors font-medium text-lg"
                  >
                    <User className="h-5 w-5 mr-3" />
                    Mon compte
                  </Link>
                  
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center px-4 py-3 rounded-lg text-violet-600 hover:bg-accent transition-colors font-medium text-lg"
                    >
                      <Shield className="h-5 w-5 mr-3" />
                      Administration
                    </Link>
                  )}
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-4 py-3 rounded-lg text-destructive hover:bg-accent transition-colors font-medium text-lg w-full text-left"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Déconnexion
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
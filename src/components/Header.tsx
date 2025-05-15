import React from 'react';
import { Search, User, Mail, LogOut } from 'lucide-react';
import '../styles/Header.css'; 

interface HeaderProps {
    onSearch?: (searchTerm: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onSearch) {
            onSearch(e.target.value);
        }
    };

    return (
        <div className="navbar">
            <div className="navbar-left">
                <div className="logo" >Logo</div>
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Thanh tìm kiếm"
                        className="search-input"
                        onChange={handleSearchChange}
                    />
                    <Search className="search-icon" />
                </div>
            </div>
            <div className="navbar-right">
                <button className="icon-button">
                    <User className="h-6 w-6" style={{ color: '#4B5563' }} />
                </button>
                <button className="icon-button">
                    <Mail className="h-6 w-6" style={{ color: '#4B5563' }} />
                </button>
                <button className="logout-button">
                    <LogOut className="h-5 w-5" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );
};

export default Header;
import { useState, useEffect, useRef } from "react";
import { searchAPI } from "../api/search.api";
import { useNavigate } from "react-router-dom";
import "./SearchBar.css";

interface SearchResult {
  _id: string;
  name: string;
  email: string;
  headline?: string;
  location?: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setLoading(true);
      try {
        const data = await searchAPI.searchUsers(query);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <div className="search-spinner"></div>}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((user) => (
            <div key={user._id} className="search-result-item" onClick={() => navigate(`/profile/${user._id}`)}>
              <div className="result-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="result-info">
                <h4>{user.name}</h4>
                <p>{user.headline || user.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="search-results">
          <div className="no-results">No users found</div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button, Input, ScrollArea } from "../../ui";
import { SUGGESTED_SKILLS } from "@/lib/skills";
import { cn } from "@/lib/cn";

const SkillsTagInput = ({ skills, skillsInput, onChange, onKeyDown, onBlur, onRemove, disabled }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  const filteredSuggestions = useMemo(() => {
    if (!skillsInput.trim()) return [];
    const input = skillsInput.toLowerCase();
    return SUGGESTED_SKILLS.filter(
      (skill) => 
        skill.toLowerCase().includes(input) && 
        !skills.some(s => s.toLowerCase() === skill.toLowerCase())
    ).slice(0, 8);
  }, [skillsInput, skills]);

  useEffect(() => {
    setActiveIndex(-1);
    setShowSuggestions(filteredSuggestions.length > 0);
  }, [filteredSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (skill) => {
    const exists = skills.some(s => s.toLowerCase() === skill.toLowerCase());
    if (!exists) {
      onKeyDown({ 
        key: "Enter", 
        preventDefault: () => {}, 
        target: { value: skill },
        overrideValue: skill 
      });
    }
    setShowSuggestions(false);
    onChange(""); 
  };

  const handleKeyDownInternal = (e) => {
    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[activeIndex]);
        return;
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        return;
      }
    }
    onKeyDown(e);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 relative" ref={containerRef}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        Skills / Expertise Tags
      </p>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-xs text-foreground font-medium whitespace-nowrap"
          >
            {skill}
            <Button
              type="button"
              onClick={() => onRemove(skill)}
              variant="ghost"
              size="xs"
              className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
              disabled={disabled}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256">
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
              </svg>
            </Button>
          </span>
        ))}
      </div>

      <div className="relative">
        <Input
          className="h-10 rounded-lg border-border bg-card font-medium"
          placeholder="Type a skill (e.g. React, Python)"
          value={skillsInput}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDownInternal}
          disabled={disabled}
        />

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border shadow-xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            <ScrollArea className="max-h-[200px]">
              <div className="p-1">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer",
                      index === activeIndex ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsTagInput;


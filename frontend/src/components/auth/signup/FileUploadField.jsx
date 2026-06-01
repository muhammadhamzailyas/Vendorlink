import React from "react";
import { Upload, CheckCircle, X } from "@phosphor-icons/react";
import { Button } from "../../ui";

const FileUploadField = ({ label, file, onFileChange, onRemove, id }) => {
  const fileName = typeof file === "string" ? file.split("/").pop() : file?.name;

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-widest text-muted-foreground/60">{label}</label>
      {file ? (
        <div className="flex items-center justify-between p-3 rounded-xl border border-ring/20 bg-foreground/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <CheckCircle className="h-5 w-5 text-foreground shrink-0" />
            <span className="text-sm font-medium truncate">{fileName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-muted-foreground hover:text-destructive text-[10px]">
            REMOVE
          </Button>
        </div>
      ) : (
        <div 
          onClick={() => document.getElementById(id).click()}
          className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border hover:border-ring/50 hover:bg-muted/50 cursor-pointer transition-all"
        >
          <Upload className="h-5 w-5 text-muted-foreground mb-1" />
          <span className="text-xs font-medium text-muted-foreground">Upload Document</span>
          <input 
            id={id}
            type="file" 
            className="hidden" 
            onChange={(e) => onFileChange(e.target.files[0])}
            accept=".pdf,.png,.jpg,.jpeg"
          />
        </div>
      )}
    </div>
  );
};

export default FileUploadField;





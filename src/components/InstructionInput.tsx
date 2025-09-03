import { useState, useEffect, useRef } from 'react';
import { useFileContext } from '../contexts/FileContext';

export default function InstructionInput() {
  const [instructions, setInstructions] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setHasUnsavedChanges } = useFileContext();

  const lines = instructions.split('\n');

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleFileOpened = (event: CustomEvent) => {
      setInstructions(event.detail);
      setHasUnsavedChanges(false);
    };

    const handleRequestContent = () => {
      window.dispatchEvent(new CustomEvent('getContent', { detail: instructions }));
    };

    const handleNewFile = () => {
      setInstructions('');
      setHasUnsavedChanges(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    window.addEventListener('fileOpened', handleFileOpened as EventListener);
    window.addEventListener('requestContent', handleRequestContent);
    window.addEventListener('newFile', handleNewFile);

    return () => {
      window.removeEventListener('fileOpened', handleFileOpened as EventListener);
      window.removeEventListener('requestContent', handleRequestContent);
      window.removeEventListener('newFile', handleNewFile);
    };
  }, [instructions, setHasUnsavedChanges]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const indent = '  ';
      const updatedValue =
        instructions.substring(0, start) + indent + instructions.substring(end);

      setInstructions(updatedValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + indent.length;
      }, 0);
    }
  };

  return (
    <div className="flex flex-row h-full bg-[#121212] text-white font-mono text-lg">
      {/* Line Numbers */}
      <div className="bg-[#1f1f1f] text-gray-400 px-2 py-2 text-right select-none">
        {lines.map((_, index) => (
          <div key={index} className="leading-[3rem]">{index + 1}</div>
        ))}
      </div>

      {/* Instruction Editor */}
      <textarea
        ref={textareaRef}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        value={instructions}
        onChange={(e) => {
          setInstructions(e.target.value);
          setHasUnsavedChanges(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type your instructions here."
        className="flex-grow bg-transparent p-2 resize-none outline-none leading-[3rem] whitespace-pre"
        style={{ lineHeight: '3rem' }}
      />
    </div>
  );
}

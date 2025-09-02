import { useState } from 'react';

export default function InstructionInput() {
  const [instructions, setInstructions] = useState("");

  const lines = instructions.split('\n');

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
     
      <div className="bg-[#1f1f1f] text-gray-400 px-2 py-2 text-right select-none">
        {lines.map((_, index) => (
          <div key={index} className="leading-[3rem]">{index + 1}</div>
        ))}
      </div>

      
      <textarea
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your instructions here."
        className="flex-grow bg-transparent p-2 resize-none outline-none leading-[3rem] whitespace-pre"
        style={{ lineHeight: '3rem' }}
      />
    </div>
  );
}

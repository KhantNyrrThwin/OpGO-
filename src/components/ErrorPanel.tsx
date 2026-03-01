import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AlertCircle, X, AlertTriangle, Info, Lightbulb } from 'lucide-react';

export interface ValidationError {
    line: number;
    message: string;
    type: 'semicolon' | 'syntax' | 'invalid_instruction';
}

export default function ErrorPanel() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [selectedError, setSelectedError] = useState<number | null>(null);

    useEffect(() => {
        const handleErrorsUpdated = (event: CustomEvent) => {
            setErrors(event.detail as ValidationError[]);
        };

        window.addEventListener('onErrorsUpdated', handleErrorsUpdated as EventListener);
        return () => {
            window.removeEventListener('onErrorsUpdated', handleErrorsUpdated as EventListener);
        };
    }, []);

    const getErrorIcon = (type: string) => {
        switch (type) {
            case 'semicolon': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
            case 'syntax': return <AlertCircle className="h-4 w-4 text-red-400" />;
            case 'invalid_instruction': return <X className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-400" />;
        }
    };

    const getErrorColor = (type: string) => {
        if (isDark) {
            switch (type) {
                case 'semicolon': return 'border-orange-400 bg-orange-900/20';
                case 'syntax': return 'border-red-400 bg-red-900/20';
                case 'invalid_instruction': return 'border-red-500 bg-red-900/30';
                default: return 'border-blue-400 bg-blue-900/20';
            }
        } else {
            switch (type) {
                case 'semicolon': return 'border-orange-400 bg-orange-100';
                case 'syntax': return 'border-red-400 bg-red-100';
                case 'invalid_instruction': return 'border-red-500 bg-red-100';
                default: return 'border-blue-400 bg-blue-100';
            }
        }
    };

    const getErrorPriority = (type: string) => {
        switch (type) {
            case 'semicolon': return 1;
            case 'syntax': return 2;
            case 'invalid_instruction': return 3;
            default: return 4;
        }
    };

    const getQuickFix = (error: ValidationError) => {
        if (error.type === 'semicolon') {
            return 'Add semicolon (;) at the end';
        }
        return null;
    };

    const applyQuickFix = (error: ValidationError) => {
        window.dispatchEvent(new CustomEvent('applyQuickFix', { detail: error }));
    };

    const sortedErrors = [...errors].sort((a, b) => getErrorPriority(a.type) - getErrorPriority(b.type));

    if (errors.length === 0) {
        return (
            <div className={`h-full flex flex-col items-center justify-center p-6 text-center ${isDark ? 'text-gray-400' : 'text-neutral-500'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-neutral-200'}`}>
                    <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">No Errors Found</h3>
                <p className="text-sm opacity-80 max-w-xs">Your code looks good! Any syntax errors or missing semicolons will appear here.</p>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col ${isDark ? 'bg-[#16162a]' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-800' : 'border-neutral-200'}`}>
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <span className="font-semibold text-red-500">
                        {errors.length} Error{errors.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-neutral-600'} flex-wrap justify-end`}>
                    {sortedErrors.filter(e => e.type === 'semicolon').length > 0 && (
                        <span className="px-2 py-1 bg-orange-900/30 text-orange-400 rounded-md text-xs font-medium border border-orange-500/20">
                            {sortedErrors.filter(e => e.type === 'semicolon').length} Missing Semicolon
                        </span>
                    )}
                    {sortedErrors.filter(e => e.type === 'syntax').length > 0 && (
                        <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded-md text-xs font-medium border border-red-500/20">
                            {sortedErrors.filter(e => e.type === 'syntax').length} Syntax
                        </span>
                    )}
                    {sortedErrors.filter(e => e.type === 'invalid_instruction').length > 0 && (
                        <span className="px-2 py-1 bg-red-900/40 text-red-300 rounded-md text-xs font-medium border border-red-400/20">
                            {sortedErrors.filter(e => e.type === 'invalid_instruction').length} Invalid
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sortedErrors.map((error, index) => (
                    <div
                        key={index}
                        className={`border-l-4 rounded-r-lg shadow-sm ${getErrorColor(error.type)} p-4 transition-all cursor-pointer hover:shadow-md ${selectedError === index ? (isDark ? 'bg-gray-800/60' : 'bg-neutral-50') : (isDark ? 'bg-gray-800/20' : 'bg-white')} ${isDark ? '' : 'border border-neutral-200 border-l-4'}`}
                        onClick={() => {
                            setSelectedError(selectedError === index ? null : index);
                            window.dispatchEvent(new CustomEvent('highlightErrorLine', { detail: error.line }));
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                                <div className="mt-0.5">{getErrorIcon(error.type)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`font-mono text-sm font-bold ${isDark ? 'text-gray-200' : 'text-neutral-800'}`}>
                                            Line {error.line + 1}
                                        </span>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-neutral-200 text-neutral-600'}`}>
                                            {error.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className={`${isDark ? 'text-gray-300' : 'text-neutral-700'} text-sm leading-relaxed mb-2`}>{error.message}</p>

                                    {/* Quick Fix Suggestion */}
                                    {getQuickFix(error) && (
                                        <div className={`mt-3 p-2.5 rounded-md flex items-center justify-between gap-3 ${isDark ? 'bg-gray-900/50 border border-gray-700' : 'bg-neutral-50 border border-neutral-200'}`}>
                                            <div className="flex items-center gap-2">
                                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-neutral-700'}`}>{getQuickFix(error)}</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    applyQuickFix(error);
                                                }}
                                                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500 focus:ring-offset-gray-900' : 'bg-blue-100 hover:bg-blue-200 text-blue-800 focus:ring-blue-500 focus:ring-offset-white'}`}
                                            >
                                                Apply Fix
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Expanded Error Details */}
                        {selectedError === index && (
                            <div className={`mt-4 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-neutral-200'}`}>
                                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-neutral-600'}`}>
                                    {error.type === 'semicolon' && (
                                        <div className="flex gap-2">
                                            <span className="text-xl">💡</span>
                                            <p>All instructions must end with a semicolon (;). This is required for the simulator to properly parse and execute each line.</p>
                                        </div>
                                    )}
                                    {error.type === 'syntax' && (
                                        <div className="flex gap-2">
                                            <span className="text-xl">💡</span>
                                            <p>Check the instruction format and operands. Ensure you are using the correct registers (A, B, C, D, E, H, L, M) and memory addresses (like 2000H).</p>
                                        </div>
                                    )}
                                    {error.type === 'invalid_instruction' && (
                                        <div className="flex gap-2">
                                            <span className="text-xl">💡</span>
                                            <p>This instruction doesn't exist or is misspelled. Use the instruction reference (ℹ️ icon) to see the full list of valid instructions.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

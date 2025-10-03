import re
import nltk
import numpy as np
import random
from nltk.tokenize import sent_tokenize, word_tokenize
from collections import Counter, defaultdict
from typing import List, Dict, Any, Tuple, Set

# Download NLTK resources
nltk.download('punkt', quiet=True)


class StyleAnalyzer:
    def __init__(self):
        self.samples = []
        
    
    def add_sample(self, text: str):
        """Add a writing sample to the analyzer."""
        self.samples.append(text)
        
    
    def clear_samples(self):
        """Clear all samples from the analyzer."""
        self.samples = []
        
    
    def analyze(self) -> Dict[str, Any]:
        """Analyze the style of all added samples in detail."""
        if not self.samples:
            raise ValueError("No samples added to analyze")
            
        combined_text = "\n\n".join(self.samples)
        
        # Basic tokenization
        sentences = sent_tokenize(combined_text)
        words = word_tokenize(combined_text)
        paragraphs = [p.strip() for p in combined_text.split('\n\n') if p.strip()]
        
        # Advanced style features
        sentence_lengths = [len(word_tokenize(s)) for s in sentences]
        word_lengths = [len(w) for w in words if w.isalpha()]
        
        # Sentence structure analysis
        sentence_starters = self._analyze_sentence_starters(sentences)
        sentence_types = self._categorize_sentence_types(sentences)
        
        # Vocabulary analysis
        words_lower = [w.lower() for w in words if w.isalpha()]
        word_freq = Counter(words_lower)
        vocab = set(words_lower)
        
        # N-gram analysis for distinctive phrase patterns
        bigrams = self._extract_ngrams(words_lower, 2)
        trigrams = self._extract_ngrams(words_lower, 3)
        
        # Unique phrases and patterns
        signature_phrases = self._find_signature_phrases(bigrams, trigrams)
        
        # Paragraph structure
        paragraph_lengths = [len(sent_tokenize(p)) for p in paragraphs]
        paragraph_patterns = self._analyze_paragraph_patterns(paragraphs)
        
        # Punctuation analysis (detailed)
        punctuation_patterns = self._analyze_punctuation(combined_text)
        
        # Calculate overall metrics
        lexical_diversity = len(vocab) / len(words_lower) if words_lower else 0
        
        # Extract representative excerpts with different characteristics
        diverse_excerpts = self._extract_diverse_excerpts(sentences, sentence_lengths, 3)
        
        # Personal quirks and patterns
        quirks = self._identify_writing_quirks(
            combined_text, 
            sentence_starters, 
            punctuation_patterns, 
            signature_phrases
        )
        
        # Compile detailed style profile
        style_profile = {
            "sentence_stats": {
                "avg_length": np.mean(sentence_lengths),
                "std_dev": np.std(sentence_lengths),
                "min_length": min(sentence_lengths) if sentence_lengths else 0,
                "max_length": max(sentence_lengths) if sentence_lengths else 0,
                "length_distribution": self._get_length_distribution(sentence_lengths),
                "common_starters": sentence_starters[:5],
                "sentence_types": sentence_types
            },
            "word_stats": {
                "avg_length": np.mean(word_lengths) if word_lengths else 0,
                "vocabulary_size": len(vocab),
                "lexical_diversity": lexical_diversity,
                "distinctive_words": self._find_distinctive_words(word_freq),
                "rare_words": self._find_rare_words(word_freq)
            },
            "structure_stats": {
                "avg_paragraph_sentences": np.mean(paragraph_lengths) if paragraph_lengths else 0,
                "paragraph_patterns": paragraph_patterns,
                "punctuation_patterns": punctuation_patterns,
                "transition_phrases": self._find_transition_phrases(sentences),
            },
            "distinctive_patterns": {
                "signature_phrases": signature_phrases,
                "quirks": quirks,
                "rhythm_pattern": self._analyze_rhythm(sentence_lengths),
            },
            # Sample excerpts for the prompt
            "excerpts": diverse_excerpts
        }
        
        # Generate human-readable style description
        style_profile["description"] = self._generate_style_description(style_profile)
        
        # Generate specific instructions for mimicking this style
        style_profile["mimicry_instructions"] = self._generate_mimicry_instructions(style_profile)
        
        return style_profile
    
    
    def _extract_ngrams(self, tokens: List[str], n: int) -> Counter:
        """Extract n-grams from a list of tokens."""
        ngrams = []
        for i in range(len(tokens) - n + 1):
            ngram = ' '.join(tokens[i:i+n])
            ngrams.append(ngram)
        return Counter(ngrams)
    
    
    def _analyze_sentence_starters(self, sentences: List[str]) -> List[Tuple[str, float]]:
        """Analyze how sentences typically begin."""
        starters = []
        for sentence in sentences:
            words = word_tokenize(sentence)
            if words:
                # Get the first 1-2 words as potential starters
                if len(words) >= 2:
                    starter = ' '.join(words[:2]).lower()
                else:
                    starter = words[0].lower()
                starters.append(starter)
        
        # Count frequency and calculate percentage
        counter = Counter(starters)
        total = len(starters)
        return [(phrase, count/total*100) for phrase, count in counter.most_common(10)]
    
    
    def _categorize_sentence_types(self, sentences: List[str]) -> Dict[str, float]:
        """Categorize sentences by type (question, statement, exclamation, etc.)."""
        types = {
            "question": 0,
            "exclamation": 0,
            "complex": 0,  # Contains semicolons or multiple clauses
            "simple": 0,
            "quote_containing": 0
        }
        
        for sentence in sentences:
            if '?' in sentence:
                types["question"] += 1
            elif '!' in sentence:
                types["exclamation"] += 1
            elif ';' in sentence or ', and' in sentence.lower() or ', but' in sentence.lower():
                types["complex"] += 1
            else:
                types["simple"] += 1
            
            if '"' in sentence or "'" in sentence:
                types["quote_containing"] += 1
        
        # Convert to percentages
        total = len(sentences)
        return {k: (v/total*100) for k, v in types.items()}
    
    
    def _analyze_punctuation(self, text: str) -> Dict[str, Any]:
        """Analyze punctuation patterns in detail."""
        # Count basic punctuation
        punctuation_marks = ['.', ',', ';', ':', '!', '?', '-', '(', ')', '"', "'"]
        punct_counts = {p: text.count(p) for p in punctuation_marks}
        
        # Calculate punctuation density (per 100 words)
        words = word_tokenize(text)
        word_count = len([w for w in words if w.isalpha()])
        density = sum(punct_counts.values()) / (word_count / 100) if word_count else 0
        
        # Look for specific patterns
        patterns = {
            "em_dash_usage": text.count('—') + text.count('--'),
            "ellipsis_usage": text.count('...'),
            "semicolon_frequency": punct_counts.get(';', 0) / (word_count / 1000) if word_count else 0,
            "exclamation_frequency": punct_counts.get('!', 0) / (word_count / 1000) if word_count else 0,
            "parenthetical_usage": min(punct_counts.get('(', 0), punct_counts.get(')', 0)),
            "quote_style": "double" if punct_counts.get('"', 0) > punct_counts.get("'", 0) else "single"
        }
        
        return {
            "counts": punct_counts,
            "density": density,
            "patterns": patterns
        }
    
    
    def _analyze_paragraph_patterns(self, paragraphs: List[str]) -> Dict[str, Any]:
        """Analyze paragraph structure patterns."""
        # Length distribution
        lengths = [len(sent_tokenize(p)) for p in paragraphs]
        
        # Check for specific patterns
        has_one_sentence_paragraphs = any(l == 1 for l in lengths)
        has_very_long_paragraphs = any(l > 5 for l in lengths)
        
        # Are paragraphs consistent in length or varied?
        length_variation = np.std(lengths) if lengths else 0
        length_consistency = "consistent" if length_variation < 1.5 else "varied"
        
        return {
            "avg_sentences": np.mean(lengths) if lengths else 0,
            "length_variation": length_variation,
            "length_consistency": length_consistency,
            "uses_one_sentence_paragraphs": has_one_sentence_paragraphs,
            "uses_long_paragraphs": has_very_long_paragraphs
        }
    
    
    def _analyze_rhythm(self, sentence_lengths: List[int]) -> str:
        """Analyze the rhythm pattern of sentence lengths."""
        if not sentence_lengths or len(sentence_lengths) < 3:
            return "insufficient data"
            
        # Is there a pattern of variation? e.g., short-long-short
        diffs = [sentence_lengths[i+1] - sentence_lengths[i] for i in range(len(sentence_lengths)-1)]
        
        # Check for alternating pattern
        alternating = all((diffs[i] > 0 and diffs[i+1] < 0) or (diffs[i] < 0 and diffs[i+1] > 0) 
                         for i in range(len(diffs)-1))
        
        # Check for ascending or descending pattern
        ascending = all(d > 0 for d in diffs)
        descending = all(d < 0 for d in diffs)
        
        # Calculate proportion of short, medium, long sentences
        short = sum(1 for l in sentence_lengths if l < 10) / len(sentence_lengths)
        medium = sum(1 for l in sentence_lengths if 10 <= l <= 20) / len(sentence_lengths)
        long = sum(1 for l in sentence_lengths if l > 20) / len(sentence_lengths)
        
        if alternating:
            return "alternating"
        elif ascending:
            return "ascending"
        elif descending:
            return "descending"
        elif short > 0.6:
            return "predominantly short"
        elif long > 0.6:
            return "predominantly long"
        else:
            return "mixed"
    
    
    def _get_length_distribution(self, lengths: List[int]) -> Dict[str, float]:
        """Get distribution of sentence lengths by category."""
        if not lengths:
            return {"short": 0, "medium": 0, "long": 0}
            
        short = sum(1 for l in lengths if l < 10) / len(lengths)
        medium = sum(1 for l in lengths if 10 <= l <= 20) / len(lengths)
        long = sum(1 for l in lengths if l > 20) / len(lengths)
        
        return {
            "short": short * 100,  # as percentage
            "medium": medium * 100,
            "long": long * 100
        }
    
    
    def _find_distinctive_words(self, word_freq: Counter, top_n: int = 10) -> List[str]:
        """Find words that are distinctive to this writing style."""
        # Filter out common stopwords
        common_words = {"the", "a", "an", "and", "but", "or", "in", "on", "at", "to", "of", 
                       "for", "with", "by", "about", "like", "as", "from", "that", "this",
                       "it", "is", "are", "was", "were", "be", "been", "being"}
        
        distinctive = [(word, count) for word, count in word_freq.most_common(50) 
                       if word not in common_words and len(word) > 3]
        
        return [word for word, _ in distinctive[:top_n]]
    
    
    def _find_rare_words(self, word_freq: Counter, n: int = 5) -> List[str]:
        """Find relatively rare or unusual words used by the author."""
        # Words used only 1-2 times that are longer (potentially more specialized)
        rare_words = [(word, count) for word, count in word_freq.items() 
                     if 1 <= count <= 2 and len(word) > 5]
        
        # Sort by word length (more complex words first)
        rare_words.sort(key=lambda x: len(x[0]), reverse=True)
        
        return [word for word, _ in rare_words[:n]]
    
    
    def _find_signature_phrases(self, bigrams: Counter, trigrams: Counter) -> List[str]:
        """Find phrases that appear to be characteristic of this writing style."""
        # Combine the most common bi and trigrams
        signature_phrases = []
        
        # Add top bigrams (avoiding very common ones)
        common_bigrams = {"of the", "in the", "to the", "on the", "and the"}
        for phrase, count in bigrams.most_common(20):
            if count > 1 and phrase not in common_bigrams:
                signature_phrases.append(phrase)
        
        # Add top trigrams
        common_trigrams = {"one of the", "out of the", "as well as", "in order to"}
        for phrase, count in trigrams.most_common(10):
            if count > 1 and phrase not in common_trigrams:
                signature_phrases.append(phrase)
        
        # Cap at 10 total phrases
        return signature_phrases[:10]
    
    
    def _find_transition_phrases(self, sentences: List[str]) -> List[str]:
        """Identify transition phrases or words used to connect sentences."""
        transition_words = [
            "however", "therefore", "moreover", "furthermore", "nevertheless",
            "consequently", "alternatively", "meanwhile", "subsequently", "conversely",
            "indeed", "similarly", "likewise", "in contrast", "for instance",
            "specifically", "notably", "primarily", "certainly", "undoubtedly"
        ]
        
        found_transitions = set()
        for sentence in sentences:
            words = word_tokenize(sentence.lower())
            # Check if sentence starts with a transition
            if words and words[0] in transition_words:
                found_transitions.add(words[0])
            # Check if transitions appear after commas
            sentence_lower = sentence.lower()
            for trans in transition_words:
                if f", {trans}" in sentence_lower:
                    found_transitions.add(trans)
        
        return list(found_transitions)
    
    
    def _identify_writing_quirks(self, text: str, starters: List, punct: Dict, phrases: List) -> List[str]:
        """Identify unique quirks or patterns in the writing."""
        quirks = []
        
        # Check for specific patterns
        if text.count("I think") > 2:
            quirks.append("frequently uses 'I think' to qualify statements")
            
        if sum(1 for s in starters if s[0].startswith(("and", "but"))) >= 2:
            quirks.append("starts sentences with conjunctions (and, but)")
            
        if punct["patterns"]["em_dash_usage"] > 3:
            quirks.append("heavy use of em dashes")
            
        if punct["patterns"]["parenthetical_usage"] > 3:
            quirks.append("frequently uses parentheticals")
            
        # Pattern of repeated words
        repeat_pattern = re.findall(r'(\b\w+\b)(?:\s+\w+){1,4}\s+\1\b', text.lower())
        if repeat_pattern:
            quirks.append("tends to repeat key words within close proximity")
            
        # Sentence fragments
        fragments = sum(1 for s in sent_tokenize(text) if len(word_tokenize(s)) < 5)
        if fragments > 2:
            quirks.append("uses sentence fragments for emphasis")
            
        # Check capitalization patterns (ALL CAPS for emphasis)
        if re.search(r'\b[A-Z]{2,}\b', text):
            quirks.append("uses ALL CAPS for emphasis")
            
        # Add any other identified patterns
        return quirks
    
    
    def _extract_diverse_excerpts(self, sentences: List[str], lengths: List[int], num_excerpts: int = 3) -> List[str]:
        """Extract diverse representative excerpts that showcase different writing characteristics."""
        if len(sentences) <= num_excerpts:
            return sentences
        
        # Aim for diversity in excerpts
        excerpts = []
        
        # Get a short, medium, and long sentence if possible
        sentence_categories = {
            "short": [s for s, l in zip(sentences, lengths) if l < 20],
            "medium": [s for s, l in zip(sentences, lengths) if 20 <= l <= 40],
            "long": [s for s, l in zip(sentences, lengths) if l > 40]
        }
        
        # Try to get one from each category
        for category in ["short", "medium", "long"]:
            if sentence_categories[category]:
                # Get a random sentence from this category
                excerpt = random.choice(sentence_categories[category])
                if excerpt not in excerpts:
                    excerpts.append(excerpt)
                
                # If we have enough excerpts, we're done
                if len(excerpts) >= num_excerpts:
                    break
        
        # If we still need more excerpts, get them from random positions
        while len(excerpts) < num_excerpts and len(excerpts) < len(sentences):
            position = random.randint(0, len(sentences) - 1)
            if sentences[position] not in excerpts:
                excerpts.append(sentences[position])
        
        return excerpts
    
    
    def _generate_style_description(self, profile: Dict[str, Any]) -> str:
        """Generate a natural language description of the writing style."""
        sentence_stats = profile["sentence_stats"]
        word_stats = profile["word_stats"]
        structure_stats = profile["structure_stats"]
        distinctive = profile["distinctive_patterns"]
        
        # Sentence length description
        avg_length = sentence_stats["avg_length"]
        if avg_length < 10:
            sentence_desc = "very short, concise sentences"
        elif avg_length < 15:
            sentence_desc = "relatively short sentences"
        elif avg_length < 20:
            sentence_desc = "medium-length sentences"
        else:
            sentence_desc = "longer, more complex sentences"
            
        # Add info about distribution
        dist = sentence_stats["length_distribution"]
        if dist["short"] > 60:
            sentence_desc += " with a strong preference for brevity"
        elif dist["long"] > 60:
            sentence_desc += " with a tendency toward elaboration"
        elif sentence_stats["std_dev"] > 10:
            sentence_desc += " with notable variation in length"
        
        # Vocabulary description
        diversity = word_stats["lexical_diversity"]
        if diversity < 0.3:
            vocab_desc = "straightforward, repetitive vocabulary"
        elif diversity < 0.5:
            vocab_desc = "moderate vocabulary range"
        elif diversity < 0.7:
            vocab_desc = "varied, rich vocabulary"
        else:
            vocab_desc = "exceptionally diverse vocabulary"
        
        # Add distinctive words if available
        if word_stats["distinctive_words"]:
            vocab_desc += f" with distinctive terms like '{word_stats['distinctive_words'][0]}'"
            if len(word_stats["distinctive_words"]) > 1:
                vocab_desc += f" and '{word_stats['distinctive_words'][1]}'"
        
        # Structural patterns
        structure_desc = ""
        if structure_stats["paragraph_patterns"]["uses_one_sentence_paragraphs"]:
            structure_desc += "frequently uses single-sentence paragraphs for emphasis. "
        elif structure_stats["paragraph_patterns"]["uses_long_paragraphs"]:
            structure_desc += "develops ideas in substantial paragraphs. "
        
        # Punctuation patterns
        punct_patterns = structure_stats["punctuation_patterns"]["patterns"]
        punct_desc = []
        
        if punct_patterns["semicolon_frequency"] > 2:
            punct_desc.append("frequent semicolons")
        if punct_patterns["em_dash_usage"] > 3:
            punct_desc.append("em dashes")
        if punct_patterns["exclamation_frequency"] > 2:
            punct_desc.append("exclamations for emphasis")
        if punct_patterns["parenthetical_usage"] > 3:
            punct_desc.append("parentheticals")
            
        punct_str = ", ".join(punct_desc)
        if punct_str:
            structure_desc += f"Uses {punct_str} as stylistic elements. "
        
        # Distinctive patterns
        style_desc = ""
        if distinctive["quirks"]:
            quirk = distinctive["quirks"][0]
            style_desc += f"Distinctively {quirk}. "
        
        if distinctive["rhythm_pattern"] not in ["insufficient data", "mixed"]:
            style_desc += f"Shows a {distinctive['rhythm_pattern']} rhythm in sentence structure. "
        
        # Transitions
        if structure_stats["transition_phrases"]:
            transitions = ", ".join(f"'{t}'" for t in structure_stats["transition_phrases"][:2])
            style_desc += f"Connects ideas using transitions like {transitions}. "
        
        # Put it all together
        description = (
            f"This writing style employs {sentence_desc} and {vocab_desc}. "
            f"{structure_desc}"
            f"{style_desc}"
        )
        
        return description
    
    
    def _generate_mimicry_instructions(self, profile: Dict[str, Any]) -> str:
        """Generate specific instructions for mimicking this writing style."""
        instructions = []
        
        # Sentence structure instructions
        sent_stats = profile["sentence_stats"]
        instructions.append(f"Maintain an average sentence length of {sent_stats['avg_length']:.1f} words")
        
        # Distribution guidance
        dist = sent_stats["length_distribution"]
        instructions.append(f"Use approximately {dist['short']:.0f}% short sentences, {dist['medium']:.0f}% medium sentences, and {dist['long']:.0f}% long sentences")
        
        # Sentence beginnings
        if sent_stats["common_starters"]:
            starters = ", ".join(f"'{s[0]}'" for s in sent_stats["common_starters"][:2])
            instructions.append(f"Occasionally begin sentences with {starters}")
        
        # Vocabulary guidance
        word_stats = profile["word_stats"]
        instructions.append(f"Aim for a vocabulary diversity of {word_stats['lexical_diversity']:.2f}")
        
        if word_stats["distinctive_words"]:
            words = ", ".join(f"'{w}'" for w in word_stats["distinctive_words"][:3])
            instructions.append(f"Incorporate distinctive terms like {words} where appropriate")
        
        # Paragraph structure
        para_stats = profile["structure_stats"]["paragraph_patterns"]
        instructions.append(f"Write paragraphs with about {para_stats['avg_sentences']:.1f} sentences on average")
        
        if para_stats["uses_one_sentence_paragraphs"]:
            instructions.append("Occasionally use single-sentence paragraphs for emphasis")
        
        # Punctuation patterns
        punct = profile["structure_stats"]["punctuation_patterns"]["patterns"]
        
        if punct["semicolon_frequency"] > 2:
            instructions.append("Use semicolons to join related independent clauses")
        
        if punct["em_dash_usage"] > 3:
            instructions.append("Incorporate em dashes for abrupt breaks or emphasis")
        
        if punct["parenthetical_usage"] > 3:
            instructions.append("Use parenthetical asides to add supplementary information")
        
        # Quirks and distinctive patterns
        if profile["distinctive_patterns"]["quirks"]:
            quirks = "; ".join(profile["distinctive_patterns"]["quirks"][:2])
            instructions.append(f"Embrace stylistic quirks: {quirks}")
        
        # Rhythm pattern
        rhythm = profile["distinctive_patterns"]["rhythm_pattern"]
        if rhythm not in ["insufficient data", "mixed"]:
            instructions.append(f"Follow a {rhythm} rhythm in sentence structure")
        
        # Signature phrases
        if profile["distinctive_patterns"]["signature_phrases"]:
            phrases = ", ".join(f"'{p}'" for p in profile["distinctive_patterns"]["signature_phrases"][:2])
            instructions.append(f"Occasionally use characteristic phrases like {phrases}")
        
        # Transition words
        if profile["structure_stats"]["transition_phrases"]:
            transitions = ", ".join(f"'{t}'" for t in profile["structure_stats"]["transition_phrases"][:3])
            instructions.append(f"Connect ideas using transitions like {transitions}")

        libral_instruction = "The above instructions are good to have, but not mandatory. You can ignore some of them if they don't make sense for the content you are generating."
        
        return "\n".join(f"- {instruction}" for instruction in instructions) + "\n" + libral_instruction
class LambdaNFA:
    def __init__(self):
        self.states = []
        self.alphabet = []
        self.start_state = ""
        self.final_states = []
        self.transitions = {}  # format: {'q0': {'a': ['q1', 'q2'], 'λ': ['q3']}}
    
    def get_inputs(self):
        """Read NFA-λ specification from user"""
        print("\n" + "="*50)
        print("NFA-λ Input")
        print("="*50)
        
        # Get states
        while True:
            states_input = input("States (separate with spaces or commas): ").strip()
            if states_input:
                self.states = [s.strip() for s in states_input.replace(',', ' ').split()]
                break
            print("Error: Please enter at least one state")
        
        # Get alphabet
        while True:
            alphabet_input = input("Alphabet symbols (separate with spaces or commas): ").strip()
            if alphabet_input:
                self.alphabet = [a.strip() for a in alphabet_input.replace(',', ' ').split()]
                break
            print("Error: Please enter at least one symbol")
        
        # Get start state
        while True:
            self.start_state = input("Start state: ").strip()
            if self.start_state in self.states:
                break
            print(f"Error: Start state must be one of {self.states}")
        
        # Get final states
        while True:
            final_input = input("Final states (separate with spaces or commas): ").strip()
            if final_input:
                finals = [f.strip() for f in final_input.replace(',', ' ').split()]
                invalid = [f for f in finals if f not in self.states]
                if not invalid:
                    self.final_states = finals
                    break
                print(f"Error: States {invalid} are not in the state set")
            else:
                print("⚠️  Warning: No final state defined")
                self.final_states = []
                break
        
        # Initialize transition dictionary
        for state in self.states:
            self.transitions[state] = {}
            for symbol in self.alphabet + ['λ']:
                self.transitions[state][symbol] = []
        
        print("\n" + "-"*50)
        print("Define Transitions")
        print("Format: <source state> <symbol> <destination state>")
        print("Use 'lambda' or 'λ' for λ-transitions")
        print("Type 'done' to finish")
        print("-"*50)
        
        while True:
            trans_input = input("Transition: ").strip()
            if trans_input.lower() == 'done':
                break
            
            parts = trans_input.split()
            if len(parts) != 3:
                print("⚠️  Incorrect format. Please try again")
                continue
            
            src, symbol, dst = parts
            
            # Convert lambda to λ
            if symbol.lower() == 'lambda':
                symbol = 'λ'
            
            # Validation
            if src not in self.states:
                print(f"⚠️  Source state '{src}' is invalid")
                continue
            
            if dst not in self.states:
                print(f"⚠️  Destination state '{dst}' is invalid")
                continue
            
            if symbol != 'λ' and symbol not in self.alphabet:
                print(f"⚠️  Symbol '{symbol}' is not in the alphabet")
                continue
            
            # Add transition
            if dst not in self.transitions[src][symbol]:
                self.transitions[src][symbol].append(dst)
                print(f"✅ Transition added: {src} --{symbol}--> {dst}")
            else:
                print(f"⚠️  This transition already exists")
    
    def lambda_closure(self, state_set):
        """Compute λ-closure for a set of states"""
        closure = set(state_set)
        stack = list(state_set)
        
        while stack:
            current = stack.pop()
            # Check λ-transitions from current state
            if 'λ' in self.transitions[current]:
                for next_state in self.transitions[current]['λ']:
                    if next_state not in closure:
                        closure.add(next_state)
                        stack.append(next_state)
        
        return sorted(list(closure))
    
    def compute_all_closures(self):
        """Compute λ-closure for all states"""
        closures = {}
        for state in self.states:
            closures[state] = self.lambda_closure([state])
        return closures
    
    def simulate(self, input_string):
        """Simulate a string on the NFA-λ"""
        print(f"\n{'='*60}")
        print(f"Simulation for string: '{input_string}'")
        print('='*60)
        
        # Current states (starting with λ-closure of start state)
        current_states = self.lambda_closure([self.start_state])
        print(f"Step 0: λ-closure({{ {self.start_state} }}) = {{ {', '.join(current_states)} }}")
        
        for i, symbol in enumerate(input_string, 1):
            next_states = set()
            
            # For each current state, take transitions on the input symbol
            for state in current_states:
                if symbol in self.transitions[state]:
                    for dest in self.transitions[state][symbol]:
                        next_states.add(dest)
            
            # Compute λ-closure of the new states
            if next_states:
                closure_next = self.lambda_closure(list(next_states))
                print(f"Step {i}: Reading '{symbol}'")
                print(f"  From {{ {', '.join(current_states)} }} with '{symbol}' to {{ {', '.join(next_states)} }}")
                print(f"  λ-closure({{ {', '.join(next_states)} }}) = {{ {', '.join(closure_next)} }}")
                current_states = closure_next
            else:
                print(f"Step {i}: Reading '{symbol}'")
                print(f"  ❌ No transition from {{ {', '.join(current_states)} }} on '{symbol}'")
                current_states = []
                break
        
        # Check acceptance
        is_accepted = any(state in self.final_states for state in current_states)
        
        print(f"\n{'='*60}")
        print(f"Result: {'✅ Accepted' if is_accepted else '❌ Rejected'}")
        print(f"Final states: {{ {', '.join(current_states) if current_states else 'none'} }}")
        print(f"Accepting states: {{ {', '.join(self.final_states)} }}")
        print('='*60)
        
        return is_accepted
    
    def convert_to_nfa(self):
        """Convert NFA-λ to λ-free NFA"""
        print(f"\n{'='*60}")
        print("Convert NFA-λ to NFA without λ")
        print('='*60)
        
        # Compute λ-closure of all states
        closures = self.compute_all_closures()
        
        # Create new NFA object
        nfa = LambdaNFA()
        nfa.states = self.states.copy()
        nfa.alphabet = [s for s in self.alphabet if s != 'λ']  # Remove λ from alphabet
        nfa.start_state = self.start_state
        
        # New final states: if λ-closure of state contains a final state
        nfa.final_states = []
        for state in self.states:
            if any(s in self.final_states for s in closures[state]):
                nfa.final_states.append(state)
        
        # Initialize transitions for new NFA
        for state in nfa.states:
            nfa.transitions[state] = {}
            for symbol in nfa.alphabet:
                nfa.transitions[state][symbol] = []
        
        # Compute new transitions
        for state in self.states:
            for symbol in nfa.alphabet:
                reachable = set()
                
                # For each state in λ-closure(state)
                for s in closures[state]:
                    if symbol in self.transitions[s]:
                        for dest in self.transitions[s][symbol]:
                            # Add λ-closure of dest
                            reachable.update(closures[dest])
                
                if reachable:
                    nfa.transitions[state][symbol] = sorted(list(reachable))
        
        # Display results
        print(f"\n📋 New NFA information:")
        print(f"States: {{ {', '.join(nfa.states)} }}")
        print(f"Alphabet: {{ {', '.join(nfa.alphabet)} }}")
        print(f"Start state: {nfa.start_state}")
        print(f"Final states: {{ {', '.join(nfa.final_states)} }}")
        
        print(f"\n📊 New transition function:")
        for state in nfa.states:
            for symbol in nfa.alphabet:
                if nfa.transitions[state][symbol]:
                    dest_str = ', '.join(nfa.transitions[state][symbol])
                    print(f"  δ({state}, {symbol}) = {{ {dest_str} }}")
        
        return nfa
    
    def display_info(self):
        """Display NFA-λ information"""
        print(f"\n{'='*60}")
        print("NFA-λ Information")
        print('='*60)
        print(f"States (Q): {{ {', '.join(self.states)} }}")
        print(f"Alphabet (Σ): {{ {', '.join(self.alphabet)} }}")
        print(f"Start state (q₀): {self.start_state}")
        print(f"Final states (F): {{ {', '.join(self.final_states)} }}")
        
        print(f"\nTransition function (δ):")
        has_transitions = False
        for state in self.states:
            for symbol in self.alphabet + ['λ']:
                if self.transitions[state][symbol]:
                    has_transitions = True
                    dest_str = ', '.join(self.transitions[state][symbol])
                    print(f"  δ({state}, {symbol}) = {{ {dest_str} }}")
        
        if not has_transitions:
            print("  (no transitions defined)")
        
        print('='*60)


def main():
    """Main program function"""
    print("="*60)
    print("NFA-λ Simulator and Converter")
    print("="*60)
    
    nfa = LambdaNFA()
    
    while True:
        print("\n" + "="*60)
        print("Main Menu")
        print("="*60)
        print("1. Define new NFA-λ")
        print("2. Show NFA-λ information")
        print("3. Compute λ-closure of all states")
        print("4. Simulate a string")
        print("5. Convert to NFA without λ")
        print("6. Exit")
        print("-"*60)
        
        choice = input("Your choice: ").strip()
        
        if choice == '1':
            nfa.get_inputs()
        
        elif choice == '2':
            if not nfa.states:
                print("⚠️  Please define NFA-λ first (option 1)")
            else:
                nfa.display_info()
        
        elif choice == '3':
            if not nfa.states:
                print("⚠️  Please define NFA-λ first (option 1)")
            else:
                print(f"\n{'='*60}")
                print("λ-closure of all states")
                print('='*60)
                closures = nfa.compute_all_closures()
                for state, closure in closures.items():
                    print(f"λ-closure({state}) = {{ {', '.join(closure)} }}")
        
        elif choice == '4':
            if not nfa.states:
                print("⚠️  Please define NFA-λ first (option 1)")
            else:
                input_string = input("Enter input string: ").strip()
                if input_string:
                    nfa.simulate(input_string)
                else:
                    print("⚠️  Empty string entered")
        
        elif choice == '5':
            if not nfa.states:
                print("⚠️  Please define NFA-λ first (option 1)")
            else:
                new_nfa = nfa.convert_to_nfa()
                # Test simulation on new NFA
                test = input("\nDo you want to simulate on the new NFA? (y/n): ").strip().lower()
                if test == 'y':
                    test_string = input("Enter test string: ").strip()
                    if test_string:
                        # For the new NFA, simulate without λ-closure
                        print(f"\nSimulation on the new NFA:")
                        current_states = [new_nfa.start_state]
                        print(f"Start from: {{ {new_nfa.start_state} }}")
                        
                        for symbol in test_string:
                            next_states = set()
                            for state in current_states:
                                if symbol in new_nfa.transitions[state]:
                                    next_states.update(new_nfa.transitions[state][symbol])
                            
                            if next_states:
                                current_states = list(next_states)
                                print(f"Read '{symbol}' → {{ {', '.join(current_states)} }}")
                            else:
                                print(f"Read '{symbol}' → ❌ No transition")
                                current_states = []
                                break
                        
                        is_accepted = any(state in new_nfa.final_states for state in current_states)
                        print(f"\nResult: {'✅ Accepted' if is_accepted else '❌ Rejected'}")
        
        elif choice == '6':
            print("\nExiting...")
            break
        
        else:
            print("⚠️  Invalid choice. Please enter a number 1-6")


if __name__ == "__main__":
    main()

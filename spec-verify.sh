#!/bin/zsh
# spec-verify.sh - Quick spec verification script
# Usage: ./spec-verify.sh [e2e|drawer|all]

set -e

PROJECT_ROOT="/Users/jeffcrosley/Coding/jeffapp"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_e2e() {
    echo -e "${YELLOW}Checking E2E Spec...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Count tests (remove all whitespace)
    E2E_TESTS=$(grep "test('should" apps/nav-shell-e2e/src/navigation-shell.spec.ts | wc -l | xargs)
    TODOS=$(grep "^[[:space:]]*// TODO:" apps/nav-shell-e2e/src/navigation-shell.spec.ts | wc -l | xargs)
    
    echo "Total tests: $E2E_TESTS/31"
    echo "Orphaned TODOs: $TODOS"
    
    if [ "$E2E_TESTS" = "31" ] && [ "$TODOS" = "0" ]; then
        echo -e "${GREEN}✓ E2E Spec COMPLETE${NC}\n"
        return 0
    else
        echo -e "${RED}✗ E2E Spec INCOMPLETE${NC}\n"
        return 1
    fi
}

check_drawer() {
    echo -e "${YELLOW}Checking Drawer Unit Spec...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Count tests
    DRAWER_TESTS=$(grep "it('should" apps/nav-shell/src/app/components/navigation-drawer/navigation-drawer.component.spec.ts | wc -l | xargs)
    PLACEHOLDERS=$(grep "expect(drawerComponent).toBeTruthy()" apps/nav-shell/src/app/components/navigation-drawer/navigation-drawer.component.spec.ts | wc -l | xargs)
    
    echo "Total tests: $DRAWER_TESTS/51"
    echo "Placeholder expects: $PLACEHOLDERS"
    
    if [ "$DRAWER_TESTS" = "51" ] && [ "$PLACEHOLDERS" = "0" ]; then
        echo -e "${GREEN}✓ Drawer Spec COMPLETE${NC}\n"
        return 0
    else
        echo -e "${YELLOW}⏳ Drawer Spec IN PROGRESS (${DRAWER_TESTS}/51)${NC}\n"
        return 0 # Not a failure, just in progress
    fi
}

check_all() {
    check_e2e && check_drawer
}

# Main
case "${1:-all}" in
    e2e)
        check_e2e
        ;;
    drawer)
        check_drawer
        ;;
    all|*)
        check_all
        ;;
esac

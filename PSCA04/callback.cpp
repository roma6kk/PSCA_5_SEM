void myFunc(int x) { std::cout << x; }

void callCallback(void (*cb)(int)) {
    cb(42);
}

callCallback(myFunc);
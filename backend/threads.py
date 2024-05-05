import threading
timer_lock = threading.Lock()
from eventlet import greenthread, semaphore


timer_semaphore = semaphore.Semaphore()

def start_timer_thread(user_id, timer_type, task_function):
    print(user_id)
    print(timer_type)
    print(task_function)
    greenthread.spawn(task_function, user_id, timer_type) # compatible with monkey-patch
    # below didn't work when monkey_patch is enabled
    # monkey-patched environemnt is required for socket.emit to work
    # thread = threading.Thread(target=task_function, args=(user_id, timer_type))
    # thread.daemon = True
    # thread.start()

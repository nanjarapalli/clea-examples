
#!/bin/bash

# Loading OpenVINO variables
source /opt/intel/openvino_2021/bin/setupvars.sh

cd $(dirname $0)
source venv/bin/activate
python main.py config.ini
import pyaudio
import numpy as np
from openwakeword.model import Model
import argparse
import json
import sys

parser = argparse.ArgumentParser()

parser.add_argument(
    "--chunk_size",
    help="How much audio (in number of samples) to predict on at once",
    type=int,
    default=1280,
    required=False
)

parser.add_argument(
    "--model_paths",
    help="Comma-separated list of paths to your custom models (.onnx or .tflite files)",
    type=str,
    required=True
)

parser.add_argument(
    "--inference_framework",
    help="The inference framework to use (either 'onnx' or 'tflite')",
    type=str,
    default='onnx',
    required=False
)

args = parser.parse_args()

model_files = [path.strip() for path in args.model_paths.split(",")]

if not model_files:
    print("Error: No valid model files specified.")
    sys.exit(1)



# Run capture loop continuously, checking for wakewords
if __name__ == "__main__":
    # microphone streaming
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000
    CHUNK = args.chunk_size
    audio = pyaudio.PyAudio()
    mic_stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)

    # Load models
    owwModel = Model(wakeword_models=model_files, inference_framework=args.inference_framework)
    n_models = len(owwModel.models.keys())

    print("Started models: ")
    for _model in owwModel.models.keys():
        print(_model)
    sys.stdout.flush()
    while True:
        try:
            audio = np.frombuffer(mic_stream.read(CHUNK), dtype=np.int16)
            prediction = owwModel.predict(audio)
            
            for _model in owwModel.prediction_buffer.keys():
                scores = list(owwModel.prediction_buffer[_model])
                curr_score = scores[-1]
                
                if curr_score > 0.5:
                    result = {"model": _model, "score": float(curr_score), "status": "action detected"}
                    print(json.dumps(result))
                    sys.stdout.flush()
        except Exception as e:
            print(f"Error: {str(e)}")
            sys.stdout.flush()
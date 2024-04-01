import ExpoModulesCore
import CoreBluetooth

public class HardwareModule: Module {

    var manager: L2CAPManager? = nil

    public func definition() -> ModuleDefinition {
        Name("Hardware")
        AsyncFunction("startAsync") {
            if self.manager == nil {
                self.manager = L2CAPManager()
            }
        }
        AsyncFunction("stopAsync") {
            self.manager = nil // Should deallocate everything
        }
        AsyncFunction("registerAsync") { (device: String) in
            self.manager?.register(device)
        }
        AsyncFunction("unregisterAsync") { (device: String) in
            self.manager?.register(device)
        }
    }
    
    //
    // Lifecycle
    //

    func onCreate() {
        
    }
    
    func onDestroy() {
        
    }
}

class L2CAPManager: NSObject, CBCentralManagerDelegate {
    
    private var managerQueue = DispatchQueue.global(qos: .utility)
    private var central: CBCentralManager!
    private var registered: Set<String> = Set()
    
    override init() {
        super.init()
        self.central = CBCentralManager(delegate: self, queue: nil)
    }
    
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        print("\(central.state)")
    }
    
    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        print("didConnected to \(peripheral.identifier.uuidString)")
    }

    func register(_ device: String) {
        self.registered.insert(device)
        print("Registered \(device)")
    }
    
    func unregister(_ device: String) {
        self.registered.remove(device)
        print("Unregistered \(device)")
    }
}

<?php
include("../../connect.php"); 
include("eway_json.php");

$transaction_id = $_POST['transaction_id'];
$transaction_bill = $_POST['transaction_bill'];
$user_id = $_POST['dist_id'];
$transMode = $_POST['transMode'];
$subSupplyType = $_POST['subSupplyType'];
$supplyType = $_POST['supplyType'];
$transDistance = $_POST['transDistance'];
$toPincode = $_POST['toPincode_1'];
$vehicleType = $_POST['vehicleType_1'];
$vehicleNo = $_POST['vehicleNo_1'];
$transportedId = $_POST['transportedId_1'];
$transDocDate = $_POST['transDocDate_1'];
$transDocNo = $_POST['transDocNo_1'];
$txnType = $_POST['txnType'];
$docType_1 = $_POST['bill_type'];
$transName = $_POST['trnspoter_name'];
$partyGSTIN = $_POST['party_gstin'];
$distGSTIN = $_POST['dis_gstin'];
$source_module = isset($_POST['source_module']) ? $_POST['source_module'] : 'Web';
// $unit = $_POST['unit'];

$products=array();
$itemList = array();

date_default_timezone_set('Asia/Calcutta');
$cdate  = date("Y-m-d")." ".date('h:i:s');

/*$select_bills = mysqli_query($con,"SELECT * FROM `tbl_party_transaction`,tbl_party,tbl_distributor where transaction_id = '$transaction_id' and transaction_bill_number = '$transaction_bill' and tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_distributor.distributor_id in (SELECT tbl_user.distributor_id from tbl_user where user_id = '$user_id')");*/
$select_bills = mysqli_query($con,"SELECT * FROM `tbl_party_transaction`,tbl_party,tbl_distributor where transaction_id = '$transaction_id' and transaction_bill_number = '$transaction_bill' and tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_distributor.distributor_id ='$user_id'");

if(mysqli_num_rows($select_bills)>0)
{     
	$fetch_bills=mysqli_fetch_assoc($select_bills);

	$ewayBills=new EwayBills();
	$tax_type = $fetch_bills['distributor_gst_configure'];
/*if($fetch_bills['bill_type']='Tax Invoice'){
	$docType_1 = "INV";
}else if($fetch_bills['bill_type']='Delivery Challan'){
	$docType_1 = "CHL";
}else if($fetch_bills['bill_type']='Bill of Supply'){
	$docType_1 = "BIL";
}else if($fetch_bills['bill_type']='Others'){
	$docType_1 = "OTH";
}else if($fetch_bills['bill_type']='Bill of Entry'){
	$docType_1 = "BOE";
}*/

/*if($supplyType_1 ='Outward'){
	$supplyType = 'O';
}else if($supplyType_1 ='Inward'){
	$supplyType = 'I';
}*/

/*if($transMode_1 ='Road'){
	$transMode = 1;
}else if($transMode_1 ='Rail'){
	$transMode = 2;
}else if($transMode_1 ='Air'){
	$transMode = 3;
}else if($transMode_1 ='Ship'){
	$transMode = 4;
}*/

/*if($txnType ='Regular'){
	$txnType = 1;
}else if($txnType ='Bill To-Ship To'){
	$txnType = 2;
}else if($txnType ='Bill From-Dispatch From'){
	$txnType = 3;
}else if($txnType ='Combination of 2 and 3'){
	$txnType = 4;
}*/

/*if($vehicleType ='Regular'){
	$vehicleType = 'R';
}else if($vehicleType ='ODC'){
	$vehicleType = 'O';
}*/

/*if($subSupplyType_1 ='Supply'){
	$subSupplyType = 1;
}else if($subSupplyType_1 ='Import'){
	$subSupplyType = 2;
}else if($subSupplyType_1 ='Export'){
	$subSupplyType = 3;
}else if($subSupplyType_1 ='Job Work'){
	$subSupplyType = 4;
}else if($subSupplyType_1 ='For Own Use'){
	$subSupplyType = 5;
}else if($subSupplyType_1 ='Job work Returns'){
	$subSupplyType = 6;
}else if($subSupplyType_1 ='Sales Returns'){
	$subSupplyType = 7;
}else if($subSupplyType_1 ='Others'){
	$subSupplyType = 8;
}else if($subSupplyType_1 ='SKD/CKD'){
	$subSupplyType = 9;
}else if($subSupplyType_1 ='Line Sales'){
	$subSupplyType = 10;
}else if($subSupplyType_1 ='Recipient Not Known'){
	$subSupplyType = 11;
}else if($subSupplyType_1 ='Exhibition or Fairs'){
	$subSupplyType = 12;
}*/

$select_bills_details = mysqli_query($con,"SELECT * FROM tbl_party_transaction_detail,tbl_product where transaction_id = '$transaction_id' and tbl_product.product_id = tbl_party_transaction_detail.product_id");
if(mysqli_num_rows($select_bills_details)>0)
{		$i = 1;
		$total_amt = 0;
		$max_hsn = 0;
		$total_cgst = 0;
		$total_sgst = 0;
		$total_igst = 0;

	while($fetch_bills_details=mysqli_fetch_assoc($select_bills_details)){
			$products['itemNo'] = $i;
			$products['productName'] = $fetch_bills_details['product_name'];
			$products['productDesc'] = "";
			$products['hsnCode'] = (int)$fetch_bills_details['hsn_code'];
			$products['quantity'] = (int)$fetch_bills_details['quantity'];
			$products['qtyUnit'] = "";

			if($fetch_bills['party_code'] == $fetch_bills['state_code']){
				$products['sgstRate'] = round($fetch_bills_details['SGST'],3);
				$products['cgstRate'] = round($fetch_bills_details['CGST'],3);
				$products['igstRate'] = 0;
			}else{
				$products['sgstRate'] = 0;
				$products['cgstRate'] = 0;
				$products['igstRate'] = round($fetch_bills_details['IGST'],3);
			}

			$products['cessRate'] = round($fetch_bills_details['cess_percentage'],3);
			$products['cessNonAdvol'] = round($fetch_bills_details['cess_pc_amt'],2);

			if($tax_type == 'Exclusive'){
				$temp_amnt = round($fetch_bills_details['product_price'],2);
				$products['taxableAmount'] = round(($temp_amnt * $fetch_bills_details['quantity']),2);
			}
			else{
				$temp_amnt = round($fetch_bills_details['product_price'],2);
				$products['taxableAmount'] = round((($temp_amnt * $fetch_bills_details['quantity'])-($fetch_bills_details['CGST_amount']-$fetch_bills_details['SGST_amount']-$fetch_bills_details['IGST_amount'])),2);
			}
			
			$itemList[]=$products;

          	$i++;
          	$max_hsn = (int)$fetch_bills_details['hsn_code'];
          	$total_amt = $total_amt + round($fetch_bills_details['taxable_amount'],2);
          	$total_cgst = $total_cgst + round($fetch_bills_details['CGST_amount'],2);
          	$total_sgst = $total_sgst + round($fetch_bills_details['SGST_amount'],2);
          	$total_igst = $total_igst + round($fetch_bills_details['IGST_amount'],2);
	}
}

// setOptionalParams($fromTrdName_1,$fromAddr1_1,$fromAddr2_1,$fromPlace_1,$toTrdName_1,$toAddr1_1,$toAddr2_1,$toPlace_1,$transporterName_1,$totalValue_1,$cgstValue_1,$sgstValue_1,$igstValue_1,$cessValue_1,$TotNonAdvolVal_1,$OthValue_1,$mainHsnCode_1)
$date=date_create($fetch_bills['transaction_date']);

	$ewayBills->setOptionalParams($fetch_bills['distributor_name'],$fetch_bills['distributor_address'],"","",$fetch_bills['party_name'],$fetch_bills['party_address'],"","",$transName,$total_amt,$total_cgst,$total_sgst,$total_igst,round($fetch_bills['cess_amount'], 2),0,$fetch_bills['labour_charges']+$fetch_bills['freight_charges']+$fetch_bills['other_expenses'],$max_hsn);

// setMandatoryParams($userGstin_1,$supplyType_1,$docType_1,$docNo_1,$docDate_1,$fromGstin_1,$toGstin_1,$jsonData_1,$toPincode_1,$toStateCode_1,$actualToStateCode_1,$totInvValue_1,$transDistance_1,$transMode_1,$subSupplyType_1,$fromPincode_1,$fromStateCode_1,$actualFromStateCode_1,$transType)

if($supplyType == 'O'){
	$fromGstin = $distGSTIN;
	$toGstin = $partyGSTIN;
	if($toGstin == ''){
		$toGstin = 'URP';
	}
}else if($supplyType=='I'){
	$fromGstin = $partyGSTIN;
	$toGstin = $distGSTIN;
	if($fromGstin == ''){
		$fromGstin = 'URP';
	}
}
	$ewayBills->setMandatoryParams($fetch_bills['gstin_no'],$supplyType,$docType_1,$fetch_bills['transaction_bill_number'],date_format($date,"d/m/Y"),$fromGstin,$toGstin,$itemList,(int)$toPincode,(int)$fetch_bills['party_code'],(int)$fetch_bills['party_code'],(int)$fetch_bills['final_amt'],(int)$transDistance,$transMode,$subSupplyType,(int)$fetch_bills['code_no'],(int)$fetch_bills['state_code'],(int)$fetch_bills['state_code'],$txnType);
}

// setConditionalParams($transportedId_1,$transDocNo_1,$transDocDate_1,$vehicleNo_1,$vehicleType_1)
$transDocDate_temp = $transDocDate;
if($transDocDate!=''){
	$transDocDate = date_format(date_create($transDocDate),"d/m/Y");
}else{
	$transDocDate='';
}
	$ewayBills->setConditionalParams($transportedId,$transDocNo,$transDocDate,$vehicleNo,$vehicleType);

	$final_ans = $ewayBills->prepareJSON();	
	
	$qury = mysqli_query($con,"INSERT INTO `tbl_eway_bill_data` (`transaction_id`, `supplyType`, `subSupplyType`, `transMode`, `transporterName`, `transDistance`, `transportedId`, `transDocDate`, `transDocNo`, `vehicleType`, `vehicleNo`, `txnType`, `eway_json`, `insert_datetime`) VALUES ('$transaction_id', '$supplyType', '$subSupplyType', '$transMode', '$transName', '$transDistance', '$transportedId', '$transDocDate_temp', '$transDocNo', '$vehicleType', '$vehicleNo', '$txnType', '$final_ans', '$cdate');");


if($source_module=='Web'){
	echo"<script>
			alert('E-Way Bill Generated Successfully');
			window.location.assign('https://www.bthawk.appexperts.net/e-way-bill.php'); 
		</script>";
	// header('Location: http://testbthawk.appsmarche.com/e-way-bill.php');       
}else if($source_module=='App'){
	echo $final_ans;
}
	/*$target_path  = "../E-Way-Data/";
	if (!file_exists($target_path)) {
		mkdir($target_path, 0777, true);
	}

	$file_name = time().'_'.$transaction_bill.'_'.$transaction_id.'.json';
	$myfile = fopen("../E-Way-Data/".$file_name, "w");
	fwrite($myfile, $final_ans);
	fclose($myfile);
	
	echo "File generated successfully. Click on following URL: \n";
	echo 'http://testbthawk.appsmarche.com/E-Way-Data/'.$file_name;
	echo '<p><a href="http://testbthawk.appsmarche.com/E-Way-Data/'.$file_name.'" Download>Download</a></p>';*/
//}
?>
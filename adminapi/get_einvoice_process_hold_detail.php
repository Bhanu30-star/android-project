<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) )
{
	$session_dist_ver = $_POST['distributor_id'];	
	$res_data = mysqli_query($con,"select tbl_party_transaction.transaction_bill_number, tbl_party.party_name,tbl_party.party_phone, tbl_party_transaction.transaction_date, tbl_party_transaction.final_amt,tbl_party_transaction.transaction_id,tbl_party_transaction.generated_by from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from =tbl_user.user_id and tbl_party_transaction.transaction_to= tbl_party.party_id and tbl_party_transaction.transaction_id in (select transaction_id from tbl_party_einvoice_generation_process where distributor_id='$session_dist_ver' and status='In Process') and tbl_party_transaction.party_gstin!='' order by tbl_party_transaction.id DESC");
	$bill_process_detail=array();
	if(mysqli_num_rows($res_data)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res_data))
		{
			extract($fetch_product);
			
			$bill_process_detail['transaction_id']=$transaction_id;
			if($fetch_product['generated_by']=='Distributor') {
				$bill_process_detail['bill_no']=$txn_id;
				$bill_process_detail['type']='Payout';
				$bill_process_detail['bill_date']=date("d-M-Y", strtotime($bill_date));
			} 
			else 
			{ 
				$bill_process_detail['bill_no']=$transaction_bill_number;
				$bill_process_detail['type']='B2B';
				$bill_process_detail['bill_date']=date("d-M-Y", strtotime($transaction_date));
			}
			$bill_process_detail['buyer_detail']=$party_name ." - " . $party_phone;
			$bill_process_detail['amount']=$final_amt;
					
			$res_test_gst_intra = mysqli_query($con,"select sum(IGST_amount) as igst, sum(CGST_amount) as cgst,sum(SGST_amount) as sgst from tbl_party_transaction_detail where transaction_id = '$transaction_id'");
			while($fetch_gst=mysqli_fetch_assoc($res_test_gst_intra))
			{
				$bill_process_detail['gst_rate']= round($fetch_gst['igst']+$fetch_gst['cgst']+$fetch_gst['sgst'],2);
			}
			$response['bill_process_detail'][]=$bill_process_detail;
		}
	}
	else
	{
		$response['bill_process_detail']=NULL;
	}
	
	$res_data_2 = mysqli_query($con,"select tbl_party_transaction.transaction_bill_number, tbl_party.party_name,tbl_party.party_phone,tbl_party_transaction.transaction_date, tbl_party_transaction.final_amt,tbl_party_transaction.transaction_id,tbl_party_transaction.generated_by from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from =tbl_user.user_id and tbl_party_transaction.transaction_to= tbl_party.party_id and tbl_party_transaction.transaction_id in (select transaction_id from tbl_party_einvoice_generation_process where distributor_id='$session_dist_ver' and status='Hold') and tbl_party_transaction.party_gstin!='' order by tbl_party_transaction.id DESC");
	$bill_hold_detail=array();
	if(mysqli_num_rows($res_data_2)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res_data_2))
		{
			extract($fetch_product);
			$bill_hold_detail['transaction_id']=$transaction_id;
			if($generated_by =='Distributor') {
				$bill_hold_detail['bill_no']=$txn_id;
				$bill_hold_detail['type']='Payout';
				$bill_hold_detail['bill_date']=date("d-M-Y", strtotime($bill_date));
			} 
			else 
			{ 
				$bill_hold_detail['bill_no']=$transaction_bill_number;
				$bill_hold_detail['type']='B2B';
				$bill_hold_detail['bill_date']=date("d-M-Y", strtotime($transaction_date));
			}
			$bill_hold_detail['buyer_detail']=$party_name ." - " . $party_phone;
			$bill_hold_detail['amount']=$final_amt;
					
			$res_test_gst_intra = mysqli_query($con,"select sum(IGST_amount) as igst, sum(CGST_amount) as cgst,sum(SGST_amount) as sgst from tbl_party_transaction_detail where transaction_id = '$transaction_id'");
			while($fetch_gst=mysqli_fetch_assoc($res_test_gst_intra))
			{
				$bill_hold_detail['gst_rate']= round($fetch_gst['igst']+$fetch_gst['cgst']+$fetch_gst['sgst'],2);
			}
			$response['bill_hold_detail'][]=$bill_hold_detail;
		}
	}
	else
	{
		$response['bill_hold_detail']=NULL;
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
	
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>
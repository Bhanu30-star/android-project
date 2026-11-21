<?php
include("../../connect.php");
$response = array();
if(isset($_POST['cdate1']) && isset($_POST['cdate2']) && isset($_POST['distributor_id']) )
{
	$session_dist_ver = $_POST['distributor_id'];
	$cdate1=$_POST['cdate1'];
	$cdate2=$_POST['cdate2'];
	$cparty=$_POST['searchparty'];
	$cbillno=$_POST['sbillno'];
	$sdoc_type=$_POST['doc_type'];
	
	$distrbutr=mysqli_query($con,"SELECT gstin_no FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	$fetch_distrbutr=mysqli_fetch_assoc($distrbutr);
	$dist_gstin=$fetch_distrbutr['gstin_no'];
	
	$queryres="select tbl_party_transaction.transaction_bill_number,tbl_party.party_name,tbl_party_transaction.party_gstin,tbl_party.party_phone, tbl_party_transaction.transaction_date,tbl_party_transaction.final_amt,tbl_party_transaction.transaction_id,tbl_party.tcs_applicable,tbl_party_transaction.tcs_amount,tbl_party_transaction.generated_by from tbl_party_transaction, tbl_party, tbl_user where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_from= tbl_user.user_id and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_user.distributor_id='$session_dist_ver' and tbl_party_transaction.bill_type in ('Tax Invoice') and tbl_party_transaction.party_gstin!=''";
	if($cbillno!="")
	{
		$queryres=$queryres." "."and tbl_party_transaction.transaction_bill_number LIKE '".$cbillno."%'";
	}
	if($cparty!="")
	{
		$queryres=$queryres." "."and (tbl_party.party_name LIKE '".$cparty."%' or tbl_party.party_phone LIKE '".$cparty."%')";
	}
	if($sdoc_type!="")
	{
		if($sdoc_type=='B2B')
			$queryres=$queryres." "."and tbl_party_transaction.generated_by!='Distributor'";
		else
			$queryres=$queryres." "."and tbl_party_transaction.generated_by='Distributor'";
	}
	$queryres=$queryres." "."order by tbl_party_transaction.id DESC";
	$res = mysqli_query($con,$queryres);
	
	$bill_detail=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			if($dist_gstin!=$party_gstin)
			{
				$check_flag=0;
				$res_check_flag = mysqli_query($con,"select transaction_id,status,Irn from tbl_party_einvoice where invoice_id='".$transaction_id."' and distributor_id='$session_dist_ver' and document_type='INV'");
				if(mysqli_num_rows($res_check_flag)>0)
				{
					while($check_txn=mysqli_fetch_assoc($res_check_flag))
					{ 
						if($check_txn['status']=="Pending" || ($check_txn['Irn']!='' && $check_txn['status']=="Deleted") || $check_txn['status']=="Complete")
							$check_flag=1;
					}
				}
				$res_check_flag1 = mysqli_query($con,"select transaction_id from tbl_party_einvoice_generation_process where transaction_id='".$transaction_id."' and distributor_id='$session_dist_ver'");
				if(mysqli_num_rows($res_check_flag1)>0)
				{
					$check_flag=1;
				}
				if($fetch_product['tcs_applicable']=='Yes' && $fetch_product['tcs_amount']==0)
				{
					$check_flag=1;
				}
				if($check_flag==0) 
				{
					$res_check_flag_1 = mysqli_query($con,"select * from tbl_party_einvoice_error where transaction_id='".$transaction_id."' and distributor_id='$session_dist_ver' and status='Pending' order by error_id desc limit 1");
	
					$bill_detail['transaction_id']=$transaction_id;
					if($generated_by =='Distributor') {
						$bill_detail['bill_no']=$txn_id;
						$bill_detail['type']='Payout';
						$bill_detail['bill_date']=date("d-M-Y", strtotime($bill_date));
					} 
					else 
					{ 
						$bill_detail['bill_no']=$transaction_bill_number;
						$bill_detail['type']='B2B';
						$bill_detail['bill_date']=date("d-M-Y", strtotime($transaction_date));
					}
					$bill_detail['buyer_detail']=$party_name ." - " . $party_phone;
					$bill_detail['amount']=$final_amt;
					
					$res_test_gst_intra = mysqli_query($con,"select sum(IGST_amount) as igst, sum(CGST_amount) as cgst,sum(SGST_amount) as sgst from tbl_party_transaction_detail where transaction_id = '$transaction_id'");
					while($fetch_gst=mysqli_fetch_assoc($res_test_gst_intra))
					{
						$bill_detail['gst_rate']= round($fetch_gst['igst']+$fetch_gst['cgst']+$fetch_gst['sgst'],2);
					}
					$response['bill_detail'][]=$bill_detail;
				}
			}
		}
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
	else
	{
		$response['bill_detail']=$bill_detail;
		$response['success']='0';
		$response['details']="No Invoice Available";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>
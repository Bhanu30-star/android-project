<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$res = "select * from tbl_party_einvoice where distributor_id='$session_dist_ver' and status='Pending' and json_data!='' ORDER by document_no asc";
	$query1=mysqli_query($con,$res);
	$errorbook=array();
	if(mysqli_num_rows($query1)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($query1))
		{
			$errorbook['transaction_id']=$fetch_product2['transaction_id'];
			$errorbook['document_type']=$fetch_product2['document_type'];
			$errorbook['document_no']=$fetch_product2['document_no'];
			$errorbook['document_date']=$fetch_product2['document_date'];
			$errorbook['buyer_detail']=$fetch_product2['buyer_legalname'].' - '.$fetch_product2['buyer_phone'];
			$errorbook['doc_item_amount']=$fetch_product2['doc_item_amount'];
			$errorbook['status']=$fetch_product2['status'];
			$errorbook['error_detail']=$fetch_product2['json_data'];
			$response['errorbook'][]=$errorbook;
		}
	}
	else
	{
		$response['errorbook']=$errorbook;
	}
	$errorbook_process=array();
	$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_party_einvoice_error,tbl_party where tbl_party_transaction.transaction_id=tbl_party_einvoice_error.transaction_id and tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_einvoice_error.distributor_id='$session_dist_ver' and tbl_party_einvoice_error.status='Pending' order by tbl_party_transaction.id DESC");
	if(mysqli_num_rows($res)>0)
    {     
		while($fetch_product=mysqli_fetch_assoc($res))
        {
            extract($fetch_product);
			$errorbook_process['error_id']=$error_id;
			$errorbook_process['bill_no']=$transaction_bill_number;
			$errorbook_process['buyer_detail']=$party_name ." - " . $party_phone;
			$errorbook_process['bill_date']=date("d-M-Y", strtotime($transaction_date));
			$errorbook_process['error_detail']=$error_detail;
			$errorbook_process['insert_txn']=date("d-M-Y", strtotime($insert_date));
			$response['errorbook_process'][]=$errorbook_process;
		}
	}
	else
	{
		$response['errorbook_process']=$errorbook_process;
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
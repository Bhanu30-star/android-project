<?php
include("../../connect.php");
$response = array();
if(isset($_POST['cdate1']) && isset($_POST['cdate2']) &&  isset($_POST['distributor_id']))
{
	$cdate1=$_POST['cdate1'];
	$cdate2=$_POST['cdate2'];
	$cparty=$_POST['searchparty'];
	$cFOS=$_POST['searchFOS'];
	$searchtype=$_POST['ptype'];
	$ver = $_POST['distributor_id'];
	$res = "select *  from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_user.distributor_id='$ver' and tbl_party_transaction.bill_type='Tax Invoice' and tbl_party_transaction.generated_by!='Distributor'";
	if($cparty!="")
	{
		$res=$res." "."and (tbl_party.party_name LIKE '".$cparty."%' or tbl_party.party_phone LIKE '".$cparty."%')";
	}
	if($cFOS!="")
	{
		$res=$res." "."and tbl_user.user_name LIKE '".$cFOS."%'";
	}
	$res=$res." "."order by tbl_party_transaction.id ASC";
	
	$query3 = mysqli_query($con,$res);
	$billbook=array();
	if(mysqli_num_rows($query3)>0)
	{     
		$flagfinal=1;
		while($fetch_product2=mysqli_fetch_assoc($query3))
		{
			$bill_date=$fetch_product2['transaction_date'];
			$bill_no=$fetch_product2['transaction_bill_number'];
			$sale_type=$fetch_product2['payment_mode'];	
			if($searchtype=='pname')
				$party_name=$fetch_product2['party_name'];
			else
				$party_name=$fetch_product2['party_phone'];
			$dist_gst_config=$fetch_product2['gst_configure'];
			$mc_name=$fetch_product2['user_name'];	
			$trans_id=$fetch_product2['transaction_id'];
			$res1 = mysqli_query($con,"select *,tbl_party_transaction_detail.product_price as saleprice from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$trans_id'");
			while($fetch_product3=mysqli_fetch_assoc($res1))
			{
				if($fetch_product3['product_name']!="Airtel Money")
				{	
					if($dist_gst_config=="Inclusive")
					{
						$sale_total_amt =$fetch_product3['quantity']*$fetch_product3['saleprice'];
						$gst_cal=round(($fetch_product3['saleprice']/((100+$fetch_product3['CGST']+$fetch_product3['SGST'])/100)),4);
					}
					else
					{
						$sale_total_amt =$fetch_product3['quantity']*$fetch_product3['saleprice']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount']+$fetch_product3['cess_final_amt'];
						$gst_cal=$fetch_product3['saleprice'];
					}
					$total_qty_val=$total_qty_val+$fetch_product3['quantity'];
					$total_disc_val=$total_disc_val+$fetch_product3['product_disc'];
					$total_bill_amt=$total_bill_amt+$sale_total_amt;
					$c++;
					
					$billbook['S.No.']=$bill_no;
					$billbook['bill_date']=$bill_date;
					$billbook['party_name']=$party_name;
					$billbook['place_supply']=$fetch_product2['place_of_supply'];
					$billbook['sale_type']=$sale_type;
					$billbook['gstin_no']=$fetch_product2['gstin_no'];
					$billbook['product_name']=$fetch_product3['product_name'];
					$billbook['godown_name']=$mc_name;
					$billbook['unit']=$fetch_product3['sale_unit'];
					$billbook['quantity']=$fetch_product3['quantity'];
					$billbook['rate']=$gst_cal;
					$billbook['amount']=round($sale_total_amt,2);
					$billbook['discount']=$fetch_product3['product_disc'];
					$billbook['net_amt']=round($sale_total_amt-$fetch_product3['product_disc'],2);
					$billbook['tax_rate']=$fetch_product3['CGST']+$fetch_product3['SGST'];
					
					$billbook['primary_unit']=$fetch_product3['unit'];
					$billbook['secondary_unit']=$fetch_product3['secondary_unit'];
					
					$res_conversiondetail=mysqli_query($con,"SELECT total_unit FROM tbl_product_conversion_unit WHERE product_id='".$fetch_product3['product_id']."' and status='Active' and primary_value ='Yes'");
					if(mysqli_num_rows($res_conversiondetail)>0)
					{
						while($fetch_consume=mysqli_fetch_assoc($res_conversiondetail))
						{
							$billbook['primary_total_unit']= $fetch_consume['total_unit'];
						}
					}
					else
					{
						$billbook['primary_total_unit']= '0';
					}
					
					
					$response['billbook'][]=$billbook;
				}
			}
		}
	}
	if($flagfinal==1)
	{		
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['message']="Bill not available";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>